import { ENEMY_DEFINITIONS, enemyCountForFloor } from './balance';
import { calculateDamage, didHit } from './combat';
import { getEquippedArmor, getPlayerDefense, getStatusResistance } from './equipment';
import { appendLog, appendVisualEvent } from './gameState';
import { findPath, isWalkable, manhattan, positionKey, samePosition } from './pathfinding';
import { randomId, type Rng } from './rng';
import { addOrRefreshStatus } from './statusEffects';
import type { Direction, DungeonMap, Enemy, EnemyDefinition, GameState, Position } from './types';

function chooseEnemyDefinition(floor: number, rng: Rng): EnemyDefinition {
  const available = ENEMY_DEFINITIONS.filter((enemy) => enemy.minFloor <= floor);
  const weighted = available.flatMap((enemy) => {
    const depthBonus = Math.max(1, floor - enemy.minFloor + 1);
    return Array.from({ length: depthBonus }, () => enemy);
  });
  return rng.pick(weighted);
}

function randomFloorPositions(map: DungeonMap): Position[] {
  const positions: Position[] = [];
  for (let y = 1; y < map.height - 1; y += 1) {
    for (let x = 1; x < map.width - 1; x += 1) {
      if (map.tiles[y][x].kind !== 'wall') positions.push({ x, y });
    }
  }
  return positions;
}

function directionBetween(source: Position, target: Position): Direction {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  if (dy < 0) return 'up';
  return 'down';
}

export function createEnemiesForFloor(map: DungeonMap, floor: number, avoidPositions: Position[], rng: Rng): Enemy[] {
  const count = enemyCountForFloor(floor);
  const avoid = new Set(avoidPositions.map(positionKey));
  const occupied = new Set<string>();
  const candidates = randomFloorPositions(map).filter(
    (position) =>
      !avoid.has(positionKey(position)) &&
      avoidPositions.every((avoidPosition) => manhattan(avoidPosition, position) >= 6),
  );
  const enemies: Enemy[] = [];

  while (enemies.length < count && candidates.length > 0) {
    const index = rng.int(0, candidates.length - 1);
    const [position] = candidates.splice(index, 1);
    const key = positionKey(position);
    if (occupied.has(key)) continue;
    occupied.add(key);
    const definition = chooseEnemyDefinition(floor, rng);
    const depth = Math.max(0, floor - definition.minFloor);
    enemies.push({
      id: randomId('enemy', rng),
      kindId: definition.id,
      name: definition.name,
      hp: definition.hp + Math.floor(depth * 2.2),
      maxHp: definition.hp + Math.floor(depth * 2.2),
      attack: definition.attack + Math.floor(floor / 3),
      defense: definition.defense + Math.floor(floor / 5),
      exp: definition.exp + depth * 2,
      score: definition.score + floor * 12,
      position,
      awakeRange: definition.awakeRange,
      moveEvery: definition.moveEvery ?? 1,
      special: definition.special,
    });
  }

  return enemies;
}

function enemyAttackPlayer(state: GameState, enemy: Enemy, rng: Rng): GameState {
  const hit = didHit(0.86, rng);
  let nextState = appendVisualEvent(state, {
    kind: 'enemyAttack',
    source: { ...enemy.position },
    target: { ...state.player.position },
    direction: directionBetween(enemy.position, state.player.position),
    hit,
  });
  if (!hit) {
    return addEnemyLog(nextState, `${enemy.name}の攻撃は外れた。`, 'normal');
  }

  const armor = getEquippedArmor(state.player);
  const guardBonus = armor?.itemId === 'iron-umbrella' ? 1 : 0;
  const damage = Math.max(1, calculateDamage(enemy.attack, getPlayerDefense(state.player), rng) - guardBonus);
  let player = { ...state.player, hp: Math.max(0, state.player.hp - damage) };
  nextState = {
    ...state,
    visualEvents: nextState.visualEvents,
    player,
  };
  nextState = addEnemyLog(nextState, `${enemy.name}の攻撃。旅人は${damage}ダメージ。`, 'bad');

  if (enemy.special === 'hunger' && rng.chance(0.35)) {
    player = { ...nextState.player, hunger: Math.max(0, nextState.player.hunger - 8) };
    nextState = {
      ...nextState,
      player,
    };
    nextState = addEnemyLog(nextState, '腹ぺこ河童に荷を探られ、満腹度が8減った。', 'warn');
  }

  if (enemy.special === 'blind' && rng.chance(0.3 * (1 - getStatusResistance(nextState.player)))) {
    player = {
      ...nextState.player,
      statusEffects: addOrRefreshStatus(nextState.player.statusEffects, {
        type: 'blind',
        turns: 5,
      }),
    };
    nextState = {
      ...nextState,
      player,
    };
    nextState = addEnemyLog(nextState, '影が視界にまとわりつき、目くらましを受けた。', 'warn');
  }

  if (enemy.special === 'poison' && rng.chance(0.25 * (1 - getStatusResistance(nextState.player)))) {
    player = {
      ...nextState.player,
      statusEffects: addOrRefreshStatus(nextState.player.statusEffects, {
        type: 'poison',
        turns: 7,
      }),
    };
    nextState = {
      ...nextState,
      player,
    };
    nextState = addEnemyLog(nextState, '毒気を浴びた。', 'warn');
  }

  return nextState;
}

function addEnemyLog(state: GameState, text: string, tone: 'normal' | 'good' | 'warn' | 'bad' = 'normal'): GameState {
  return appendLog(state, text, tone);
}

function blockedPositions(enemies: Enemy[], selfId: string, playerPosition: Position): Set<string> {
  return new Set([
    positionKey(playerPosition),
    ...enemies.filter((enemy) => enemy.id !== selfId && enemy.hp > 0).map((enemy) => positionKey(enemy.position)),
  ]);
}

function randomMove(map: DungeonMap, enemy: Enemy, enemies: Enemy[], playerPosition: Position, rng: Rng): Position {
  const blocked = blockedPositions(enemies, enemy.id, playerPosition);
  const options = [
    { x: enemy.position.x, y: enemy.position.y - 1 },
    { x: enemy.position.x + 1, y: enemy.position.y },
    { x: enemy.position.x, y: enemy.position.y + 1 },
    { x: enemy.position.x - 1, y: enemy.position.y },
  ].filter((position) => isWalkable(map, position) && !blocked.has(positionKey(position)));

  return options.length > 0 ? rng.pick(options) : enemy.position;
}

function nextEnemyPosition(state: GameState, enemy: Enemy, rng: Rng): Position {
  const distance = manhattan(enemy.position, state.player.position);
  const blocked = blockedPositions(state.enemies, enemy.id, state.player.position);

  if (distance <= enemy.awakeRange) {
    const path = findPath(state.map, enemy.position, state.player.position, blocked);
    if (path.length > 0 && !samePosition(path[0], state.player.position)) {
      return path[0];
    }
  }

  return randomMove(state.map, enemy, state.enemies, state.player.position, rng);
}

export function runEnemyPhase(state: GameState, rng: Rng): GameState {
  let nextState: GameState = {
    ...state,
    enemies: state.enemies.map((enemy) => ({ ...enemy, position: { ...enemy.position } })),
  };

  for (const enemy of nextState.enemies) {
    if (nextState.status !== 'playing' || nextState.player.hp <= 0) break;
    if (enemy.hp <= 0) continue;
    if (enemy.moveEvery > 1 && nextState.turn % enemy.moveEvery !== 0) continue;

    if (manhattan(enemy.position, nextState.player.position) === 1) {
      nextState = enemyAttackPlayer(nextState, enemy, rng);
      continue;
    }

    const destination = nextEnemyPosition(nextState, enemy, rng);
    enemy.position = destination;
  }

  return nextState;
}
