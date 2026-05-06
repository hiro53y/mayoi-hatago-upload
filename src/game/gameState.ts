import { itemCountForFloor, PLAYER_BASE } from './balance';
import { LOG_LIMIT, SAVE_VERSION } from './constants';
import { createEnemiesForFloor } from './enemyAI';
import { createGroundItems } from './items';
import { generateDungeonMap, updateVisibility } from './mapGenerator';
import { hashSeed, createRng, randomId } from './rng';
import { getVisionRadius } from './statusEffects';
import type { GameState, LogEntry, Player, VisualEvent } from './types';

export function createInitialPlayer(): Player {
  return {
    position: { x: 0, y: 0 },
    facing: 'down',
    hp: PLAYER_BASE.maxHp,
    maxHp: PLAYER_BASE.maxHp,
    baseAttack: PLAYER_BASE.attack,
    baseDefense: PLAYER_BASE.defense,
    level: 1,
    exp: 0,
    hunger: PLAYER_BASE.hunger,
    maxHunger: PLAYER_BASE.hunger,
    score: 0,
    inventory: [],
    equipment: {
      weaponId: null,
      armorId: null,
    },
    statusEffects: [],
  };
}

export function appendLog(
  state: GameState,
  text: string,
  tone: LogEntry['tone'] = 'normal',
): GameState {
  const lastLog = state.logs[state.logs.length - 1];
  if (lastLog?.text === text && (lastLog.tone ?? 'normal') === (tone ?? 'normal')) {
    return {
      ...state,
      logs: [
        ...state.logs.slice(0, -1),
        {
          ...lastLog,
          turn: state.turn,
          count: (lastLog.count ?? 1) + 1,
        },
      ],
    };
  }

  const nextLogs = [
    ...state.logs,
    {
      id: state.logs.length > 0 ? state.logs[state.logs.length - 1].id + 1 : 1,
      turn: state.turn,
      text,
      tone,
      count: 1,
    },
  ].slice(-LOG_LIMIT);

  return { ...state, logs: nextLogs };
}

export function appendVisualEvent(state: GameState, event: Omit<VisualEvent, 'id'>): GameState {
  const currentEvents = state.visualEvents ?? [];
  const lastId = currentEvents.length > 0 ? currentEvents[currentEvents.length - 1].id : state.turn * 100;
  return {
    ...state,
    visualEvents: [...currentEvents, { ...event, id: lastId + 1 }].slice(-8),
  };
}

export function enterFloor(state: GameState, floor: number): GameState {
  const floorSeed = hashSeed(`${state.seed}:${floor}`);
  const rng = createRng(state.rngState ^ floorSeed);
  const rawMap = generateDungeonMap(floorSeed);
  const player = {
    ...state.player,
    position: rawMap.playerStart,
    facing: 'down' as const,
  };
  const enemies = createEnemiesForFloor(rawMap, floor, [rawMap.playerStart, rawMap.stairs], rng);
  const groundItemResult = createGroundItems(
    rawMap,
    floor,
    itemCountForFloor(floor),
    [rawMap.playerStart, rawMap.stairs, ...enemies.map((enemy) => enemy.position)],
    rng.state,
  );
  const visibleMap = updateVisibility(rawMap, player.position, getVisionRadius(player));

  return appendLog(
    {
      ...state,
      floor,
      rngState: groundItemResult.rngState,
      map: visibleMap,
      player,
      enemies,
      groundItems: groundItemResult.items,
      visualEvents: [],
      runStats: {
        ...state.runStats,
        deepestFloor: Math.max(state.runStats.deepestFloor, floor),
      },
    },
    `${floor}階に降り立った。湿った木札が小さく鳴る。`,
  );
}

export function createNewGame(seedInput: string | number = Date.now()): GameState {
  const seed = hashSeed(seedInput);
  const rng = createRng(seed);
  const baseState: GameState = {
    version: SAVE_VERSION,
    runId: randomId('run', rng),
    seed,
    rngState: rng.state,
    floor: 1,
    turn: 0,
    status: 'playing',
    map: generateDungeonMap(seed),
    player: createInitialPlayer(),
    enemies: [],
    groundItems: [],
    logs: [],
    visualEvents: [],
    runStats: {
      kills: 0,
      itemsUsed: 0,
      turns: 0,
      deepestFloor: 1,
      startedAt: new Date().toISOString(),
    },
    result: null,
  };

  return enterFloor(baseState, 1);
}
