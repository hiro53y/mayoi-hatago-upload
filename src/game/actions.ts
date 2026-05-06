import { HUNGER_DAMAGE, HUNGER_WARNING, INVENTORY_LIMIT, MAX_FLOOR } from './constants';
import { calculateDamage, didHit } from './combat';
import { getPlayerAttack, getPlayerDefense, getPlayerHitRate } from './equipment';
import { runEnemyPhase } from './enemyAI';
import { enterFloor, appendLog, appendVisualEvent } from './gameState';
import { createInventoryItem, getItemDefinition, isInventoryFull } from './items';
import { updateVisibility } from './mapGenerator';
import { manhattan, positionKey, samePosition } from './pathfinding';
import { createRng, type Rng } from './rng';
import { floorScore, grantExperience } from './score';
import {
  addOrRefreshStatus,
  getVisionRadius,
  hasStatusEffect,
  removeNegativeStatuses,
  tickStatusEffects,
} from './statusEffects';
import type { Direction, Enemy, GameResult, GameState, GroundItem, Position } from './types';

export type PlayerCommand =
  | { type: 'move'; dx: number; dy: number }
  | { type: 'wait' }
  | { type: 'useItem'; instanceId: string }
  | { type: 'dropItem'; instanceId: string }
  | { type: 'equipItem'; instanceId: string }
  | { type: 'unequip'; slot: 'weapon' | 'armor' }
  | { type: 'descend' };

function directionFromDelta(dx: number, dy: number, fallback: Direction): Direction {
  if (dx < 0) return 'left';
  if (dx > 0) return 'right';
  if (dy < 0) return 'up';
  if (dy > 0) return 'down';
  return fallback;
}

function deltaFromDirection(direction: Direction): Position {
  if (direction === 'up') return { x: 0, y: -1 };
  if (direction === 'down') return { x: 0, y: 1 };
  if (direction === 'left') return { x: -1, y: 0 };
  return { x: 1, y: 0 };
}

function enemyAt(enemies: Enemy[], position: Position): Enemy | undefined {
  return enemies.find((enemy) => enemy.hp > 0 && samePosition(enemy.position, position));
}

function cloneGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function makeResult(state: GameState, outcome: GameResult['outcome'], cause: string): GameResult {
  return {
    outcome,
    floor: state.floor,
    level: state.player.level,
    kills: state.runStats.kills,
    score: state.player.score,
    turns: state.runStats.turns,
    cause,
    itemsUsed: state.runStats.itemsUsed,
  };
}

function finishRun(state: GameState, outcome: GameResult['outcome'], cause: string): GameState {
  const result = makeResult(state, outcome, cause);
  return {
    ...state,
    status: outcome === 'clear' ? 'won' : 'lost',
    result,
    runStats: {
      ...state.runStats,
      endedAt: new Date().toISOString(),
      deathCause: outcome === 'gameover' ? cause : undefined,
    },
  };
}

function defeatEnemy(state: GameState, enemy: Enemy): GameState {
  let nextState = {
    ...state,
    enemies: state.enemies.filter((candidate) => candidate.id !== enemy.id),
    runStats: {
      ...state.runStats,
      kills: state.runStats.kills + 1,
    },
    player: {
      ...state.player,
      score: state.player.score + enemy.score,
    },
  };
  nextState = appendLog(nextState, `${enemy.name}を倒した。経験値${enemy.exp}を得た。`, 'good');
  const expResult = grantExperience(nextState.player, enemy.exp);
  nextState = {
    ...nextState,
    player: expResult.player,
  };
  for (const log of expResult.logs) nextState = appendLog(nextState, log, 'good');
  return nextState;
}

function attackEnemy(state: GameState, enemy: Enemy, rng: Rng): GameState {
  if (!didHit(getPlayerHitRate(state.player), rng)) {
    return appendLog(
      appendVisualEvent(state, {
        kind: 'playerAttack',
        source: { ...state.player.position },
        target: { ...enemy.position },
        direction: state.player.facing,
        hit: false,
      }),
      `旅人の攻撃は外れた。`,
      'normal',
    );
  }

  const damage = calculateDamage(getPlayerAttack(state.player), enemy.defense, rng);
  const nextEnemy = { ...enemy, hp: enemy.hp - damage };
  let nextState = {
    ...state,
    enemies: state.enemies.map((candidate) => (candidate.id === enemy.id ? nextEnemy : candidate)),
  };
  nextState = appendVisualEvent(nextState, {
    kind: 'playerAttack',
    source: { ...state.player.position },
    target: { ...enemy.position },
    direction: state.player.facing,
    hit: true,
  });
  nextState = appendLog(nextState, `旅人の攻撃。${enemy.name}に${damage}ダメージ。`, 'normal');
  if (nextEnemy.hp <= 0) nextState = defeatEnemy(nextState, nextEnemy);
  return nextState;
}

function pickupItems(state: GameState, rng: Rng): GameState {
  const onTile = state.groundItems.filter((item) => samePosition(item.position, state.player.position));
  if (onTile.length === 0) return state;

  let nextState = state;
  for (const item of onTile) {
    const definition = getItemDefinition(item.itemId);
    if (isInventoryFull(nextState.player.inventory)) {
      nextState = appendLog(nextState, `持ち物がいっぱいで、${definition.name}を拾えない。`, 'warn');
      continue;
    }
    nextState = {
      ...nextState,
      groundItems: nextState.groundItems.filter((groundItem) => groundItem.id !== item.id),
      player: {
        ...nextState.player,
        inventory: [...nextState.player.inventory, createInventoryItem(item.itemId, rng)],
      },
    };
    nextState = appendLog(nextState, `${definition.name}を拾った。`, 'good');
  }

  return nextState;
}

function tryMove(state: GameState, dx: number, dy: number, rng: Rng): { state: GameState; consumed: boolean } {
  const facing = directionFromDelta(dx, dy, state.player.facing);
  const target = { x: state.player.position.x + dx, y: state.player.position.y + dy };
  let nextState = {
    ...state,
    player: { ...state.player, facing },
  };

  const targetTile = state.map.tiles[target.y]?.[target.x];
  if (!targetTile || targetTile.kind === 'wall') {
    return { state: appendLog(nextState, '壁に行く手を阻まれた。'), consumed: false };
  }

  const targetEnemy = enemyAt(nextState.enemies, target);
  if (targetEnemy) {
    return { state: attackEnemy(nextState, targetEnemy, rng), consumed: true };
  }

  nextState = {
    ...nextState,
    player: {
      ...nextState.player,
      position: target,
    },
  };
  nextState = pickupItems(nextState, rng);
  return { state: nextState, consumed: true };
}

function waitTurn(state: GameState): GameState {
  const nearbyEnemy = state.enemies.some((enemy) => manhattan(enemy.position, state.player.position) <= 3);
  if (!nearbyEnemy && state.player.hunger > 0 && state.turn % 3 === 0 && state.player.hp < state.player.maxHp) {
    return appendLog(
      {
        ...state,
        player: {
          ...state.player,
          hp: Math.min(state.player.maxHp, state.player.hp + 2),
        },
      },
      '息を整え、HPが2回復した。',
      'good',
    );
  }
  return appendLog(state, '足を止めて気配を探った。');
}

function damageEnemiesByIds(state: GameState, enemyIds: string[], damage: number): GameState {
  let nextState = state;
  for (const enemyId of enemyIds) {
    const enemy = nextState.enemies.find((candidate) => candidate.id === enemyId);
    if (!enemy) continue;
    const nextEnemy = { ...enemy, hp: enemy.hp - damage };
    nextState = {
      ...nextState,
      enemies: nextState.enemies.map((candidate) => (candidate.id === enemy.id ? nextEnemy : candidate)),
    };
    nextState = appendLog(nextState, `${enemy.name}に${damage}ダメージ。`, 'normal');
    if (nextEnemy.hp <= 0) nextState = defeatEnemy(nextState, nextEnemy);
  }
  return nextState;
}

function useItem(state: GameState, instanceId: string): { state: GameState; consumed: boolean } {
  const item = state.player.inventory.find((inventoryItem) => inventoryItem.instanceId === instanceId);
  if (!item) return { state: appendLog(state, 'その道具は見当たらない。', 'warn'), consumed: false };
  const definition = getItemDefinition(item.itemId);

  if (definition.category === 'weapon' || definition.category === 'armor') {
    return equipItem(state, instanceId);
  }

  let nextState = state;
  let shouldConsumeItem = true;

  if (definition.id === 'small-herb' || definition.id === 'large-herb') {
    nextState = {
      ...nextState,
      player: {
        ...nextState.player,
        hp: Math.min(nextState.player.maxHp, nextState.player.hp + (definition.power ?? 0)),
      },
    };
    nextState = appendLog(nextState, `${definition.name}を使い、HPが回復した。`, 'good');
  } else if (definition.id === 'life-pill') {
    nextState = {
      ...nextState,
      player: {
        ...nextState.player,
        maxHp: nextState.player.maxHp + (definition.power ?? 4),
        hp: Math.min(nextState.player.maxHp + (definition.power ?? 4), nextState.player.hp + 12),
      },
    };
    nextState = appendLog(nextState, '命の丸薬が体に馴染み、最大HPが増えた。', 'good');
  } else if (definition.category === 'food') {
    nextState = {
      ...nextState,
      player: {
        ...nextState.player,
        hunger: Math.min(nextState.player.maxHunger, nextState.player.hunger + (definition.power ?? 0)),
      },
    };
    nextState = appendLog(nextState, `${definition.name}を食べた。満腹度が回復した。`, 'good');
  } else if (definition.id === 'flint') {
    const delta = deltaFromDirection(nextState.player.facing);
    const hitEnemy = [...Array(6).keys()]
      .map((step) => ({
        x: nextState.player.position.x + delta.x * (step + 1),
        y: nextState.player.position.y + delta.y * (step + 1),
      }))
      .map((position) => enemyAt(nextState.enemies, position))
      .find(Boolean);
    if (hitEnemy) {
      nextState = appendLog(nextState, '火花が一直線に走った。', 'normal');
      nextState = damageEnemiesByIds(nextState, [hitEnemy.id], definition.power ?? 14);
    } else {
      nextState = appendLog(nextState, '火花は闇に消えた。', 'warn');
    }
  } else if (definition.id === 'thunder-tag') {
    const targets = nextState.enemies
      .filter((enemy) => manhattan(enemy.position, nextState.player.position) <= 2)
      .map((enemy) => enemy.id);
    nextState = appendLog(nextState, '雷鳴の札が低く鳴った。', targets.length > 0 ? 'good' : 'warn');
    nextState = damageEnemiesByIds(nextState, targets, definition.power ?? 12);
  } else if (definition.id === 'wind-tag') {
    const delta = deltaFromDirection(nextState.player.facing);
    const targetKeys = new Set(
      [1, 2, 3].map((step) =>
        positionKey({
          x: nextState.player.position.x + delta.x * step,
          y: nextState.player.position.y + delta.y * step,
        }),
      ),
    );
    const targets = nextState.enemies
      .filter((enemy) => targetKeys.has(positionKey(enemy.position)))
      .map((enemy) => enemy.id);
    nextState = appendLog(nextState, '風切り札が通路を裂いた。', targets.length > 0 ? 'good' : 'warn');
    nextState = damageEnemiesByIds(nextState, targets, definition.power ?? 10);
  } else if (definition.id === 'wake-bell') {
    nextState = {
      ...nextState,
      player: removeNegativeStatuses(nextState.player),
    };
    nextState = appendLog(nextState, '鈴の音で悪い気配が払われた。', 'good');
  } else if (definition.id === 'swift-grass') {
    nextState = {
      ...nextState,
      player: {
        ...nextState.player,
        statusEffects: addOrRefreshStatus(nextState.player.statusEffects, {
          type: 'swift',
          turns: definition.power ?? 6,
        }),
      },
    };
    nextState = appendLog(nextState, '足が軽くなった。', 'good');
  } else if (definition.id === 'see-incense') {
    nextState = {
      ...nextState,
      player: {
        ...nextState.player,
        statusEffects: addOrRefreshStatus(nextState.player.statusEffects, {
          type: 'vision',
          turns: definition.power ?? 10,
        }),
      },
    };
    nextState = appendLog(nextState, '香りが道の輪郭を浮かび上がらせた。', 'good');
  } else {
    shouldConsumeItem = false;
    nextState = appendLog(nextState, '今は使えない。', 'warn');
  }

  if (shouldConsumeItem) {
    nextState = {
      ...nextState,
      player: {
        ...nextState.player,
        inventory: nextState.player.inventory.filter((inventoryItem) => inventoryItem.instanceId !== instanceId),
        equipment: {
          weaponId: nextState.player.equipment.weaponId === instanceId ? null : nextState.player.equipment.weaponId,
          armorId: nextState.player.equipment.armorId === instanceId ? null : nextState.player.equipment.armorId,
        },
      },
      runStats: {
        ...nextState.runStats,
        itemsUsed: nextState.runStats.itemsUsed + 1,
      },
    };
  }

  return { state: nextState, consumed: shouldConsumeItem };
}

function equipItem(state: GameState, instanceId: string): { state: GameState; consumed: boolean } {
  const item = state.player.inventory.find((inventoryItem) => inventoryItem.instanceId === instanceId);
  if (!item) return { state: appendLog(state, '装備する道具が見当たらない。', 'warn'), consumed: false };
  const definition = getItemDefinition(item.itemId);
  if (definition.slot !== 'weapon' && definition.slot !== 'armor') {
    return { state: appendLog(state, 'これは装備できない。', 'warn'), consumed: false };
  }

  const nextState = {
    ...state,
    player: {
      ...state.player,
      equipment: {
        ...state.player.equipment,
        [definition.slot === 'weapon' ? 'weaponId' : 'armorId']: instanceId,
      },
    },
  };
  return { state: appendLog(nextState, `${definition.name}を装備した。`, 'good'), consumed: true };
}

function unequipItem(state: GameState, slot: 'weapon' | 'armor'): { state: GameState; consumed: boolean } {
  const currentId = slot === 'weapon' ? state.player.equipment.weaponId : state.player.equipment.armorId;
  if (!currentId) return { state: appendLog(state, 'その部位には何も装備していない。', 'warn'), consumed: false };

  const nextState = {
    ...state,
    player: {
      ...state.player,
      equipment: {
        ...state.player.equipment,
        [slot === 'weapon' ? 'weaponId' : 'armorId']: null,
      },
    },
  };
  return { state: appendLog(nextState, '装備を外した。'), consumed: true };
}

function dropItem(state: GameState, instanceId: string): { state: GameState; consumed: boolean } {
  const item = state.player.inventory.find((inventoryItem) => inventoryItem.instanceId === instanceId);
  if (!item) return { state: appendLog(state, '捨てる道具が見当たらない。', 'warn'), consumed: false };
  const definition = getItemDefinition(item.itemId);
  const groundItem: GroundItem = {
    id: `drop-${instanceId}`,
    itemId: item.itemId,
    position: { ...state.player.position },
  };
  const nextState = {
    ...state,
    groundItems: [...state.groundItems, groundItem],
    player: {
      ...state.player,
      inventory: state.player.inventory.filter((inventoryItem) => inventoryItem.instanceId !== instanceId),
      equipment: {
        weaponId: state.player.equipment.weaponId === instanceId ? null : state.player.equipment.weaponId,
        armorId: state.player.equipment.armorId === instanceId ? null : state.player.equipment.armorId,
      },
    },
  };
  return { state: appendLog(nextState, `${definition.name}を足元に置いた。`), consumed: true };
}

function tryDescend(state: GameState): { state: GameState; consumed: boolean; skipEnemy: boolean } {
  if (!samePosition(state.player.position, state.map.stairs)) {
    return { state: appendLog(state, 'ここには下り階段がない。', 'warn'), consumed: false, skipEnemy: false };
  }

  if (state.floor + 1 >= MAX_FLOOR) {
    const nextState = {
      ...state,
      floor: MAX_FLOOR,
      player: {
        ...state.player,
        score: state.player.score + floorScore(MAX_FLOOR),
      },
    };
    return {
      state: appendLog(finishRun(nextState, 'clear', '10階到達'), '10階に到達した。不思議なダンジョンもどきを踏破した。', 'good'),
      consumed: true,
      skipEnemy: true,
    };
  }

  const nextFloor = state.floor + 1;
  const scoredState = {
    ...state,
    player: {
      ...state.player,
      score: state.player.score + floorScore(nextFloor),
    },
  };
  return { state: enterFloor(scoredState, nextFloor), consumed: true, skipEnemy: true };
}

function consumeHunger(state: GameState): GameState {
  const hunger = Math.max(0, state.player.hunger - 1);
  let nextState = {
    ...state,
    player: {
      ...state.player,
      hunger,
    },
  };
  if (hunger === HUNGER_WARNING) nextState = appendLog(nextState, '腹が空いてきた。満腹度が20を切る。', 'warn');
  if (hunger === 0) {
    nextState = {
      ...nextState,
      player: {
        ...nextState.player,
        hp: Math.max(0, nextState.player.hp - HUNGER_DAMAGE),
      },
    };
    nextState = appendLog(nextState, `空腹でHPが${HUNGER_DAMAGE}減った。`, 'bad');
  }
  return nextState;
}

function advanceTurn(state: GameState, rng: Rng, skipEnemy: boolean): GameState {
  let nextState = {
    ...state,
    turn: state.turn + 1,
    runStats: {
      ...state.runStats,
      turns: state.runStats.turns + 1,
    },
  };

  nextState = consumeHunger(nextState);

  if (!skipEnemy && nextState.status === 'playing') {
    const enemyPhases = hasStatusEffect(nextState.player, 'slow') && rng.chance(0.5) ? 2 : 1;
    const swiftSkip = hasStatusEffect(nextState.player, 'swift') && rng.chance(0.35);
    if (!swiftSkip) {
      for (let i = 0; i < enemyPhases; i += 1) {
        nextState = runEnemyPhase(nextState, rng);
      }
    } else {
      nextState = appendLog(nextState, '逃げ足が効き、敵の動きが一拍遅れた。', 'good');
    }
  }

  const statusTick = tickStatusEffects(nextState.player);
  nextState = {
    ...nextState,
    player: statusTick.player,
  };
  for (const log of statusTick.logs) nextState = appendLog(nextState, log, log.includes('ダメージ') ? 'bad' : 'normal');

  if (nextState.player.hp <= 0 && nextState.status === 'playing') {
    nextState = finishRun(nextState, 'gameover', nextState.player.hunger <= 0 ? '空腹' : '戦闘不能');
    nextState = appendLog(nextState, '旅人は迷宮の入口へ戻された。', 'bad');
  }

  return {
    ...nextState,
    map: updateVisibility(nextState.map, nextState.player.position, getVisionRadius(nextState.player)),
  };
}

export function performPlayerAction(inputState: GameState, command: PlayerCommand): GameState {
  if (inputState.status !== 'playing') return inputState;
  let state: GameState = { ...cloneGameState(inputState), visualEvents: [] };
  const rng = createRng(state.rngState);
  let consumed = false;
  let skipEnemy = false;

  if (command.type === 'move') {
    const result = tryMove(state, command.dx, command.dy, rng);
    state = result.state;
    consumed = result.consumed;
  } else if (command.type === 'wait') {
    state = waitTurn(state);
    consumed = true;
  } else if (command.type === 'useItem') {
    const result = useItem(state, command.instanceId);
    state = result.state;
    consumed = result.consumed;
  } else if (command.type === 'dropItem') {
    const result = dropItem(state, command.instanceId);
    state = result.state;
    consumed = result.consumed;
  } else if (command.type === 'equipItem') {
    const result = equipItem(state, command.instanceId);
    state = result.state;
    consumed = result.consumed;
  } else if (command.type === 'unequip') {
    const result = unequipItem(state, command.slot);
    state = result.state;
    consumed = result.consumed;
  } else if (command.type === 'descend') {
    const result = tryDescend(state);
    state = result.state;
    consumed = result.consumed;
    skipEnemy = result.skipEnemy;
  }

  if (state.player.inventory.length > INVENTORY_LIMIT) {
    state = {
      ...state,
      player: {
        ...state.player,
        inventory: state.player.inventory.slice(0, INVENTORY_LIMIT),
      },
    };
  }

  if (consumed && state.status === 'playing') {
    state = advanceTurn(state, rng, skipEnemy);
  }

  return {
    ...state,
    rngState: rng.state,
  };
}
