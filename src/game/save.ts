import { SAVE_VERSION, STORAGE_KEYS } from './constants';
import { ENEMY_DEFINITIONS } from './balance';
import { ITEM_DEFINITIONS } from './items';
import type { GameResult, GameState, Records } from './types';

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createEmptyRecords(): Records {
  return {
    version: SAVE_VERSION,
    bestFloor: 0,
    clearCount: 0,
    totalRuns: 0,
    totalKills: 0,
    bestScore: 0,
    discoveredItems: [],
    discoveredEnemies: [],
    totalTurns: 0,
    lastResult: null,
  };
}

export function saveProgress(state: GameState): void {
  const storage = getStorage();
  if (!storage || state.status !== 'playing') return;
  try {
    storage.setItem(STORAGE_KEYS.progress, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable in private browsing or low-storage modes.
  }
}

export function loadProgress(): GameState | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEYS.progress);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== SAVE_VERSION || parsed.status !== 'playing') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearProgress(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEYS.progress);
  } catch {
    // Ignore storage errors so the game can continue.
  }
}

export function loadRecords(): Records {
  const storage = getStorage();
  if (!storage) return createEmptyRecords();
  try {
    const raw = storage.getItem(STORAGE_KEYS.records);
    if (!raw) return createEmptyRecords();
    const parsed = JSON.parse(raw) as Records;
    if (parsed.version !== SAVE_VERSION) return createEmptyRecords();
    return {
      ...createEmptyRecords(),
      ...parsed,
    };
  } catch {
    return createEmptyRecords();
  }
}

export function saveRecords(records: Records): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
  } catch {
    // Records are non-critical; ignore write failures.
  }
}

export function recordRunStart(records: Records): Records {
  return {
    ...records,
    totalRuns: records.totalRuns + 1,
  };
}

export function updateRecordsFromState(records: Records, state: GameState): Records {
  const visibleItems = state.groundItems
    .filter((item) => state.map.tiles[item.position.y][item.position.x].visible)
    .map((item) => item.itemId);
  const inventoryItems = state.player.inventory.map((item) => item.itemId);
  const visibleEnemies = state.enemies
    .filter((enemy) => state.map.tiles[enemy.position.y][enemy.position.x].visible)
    .map((enemy) => enemy.kindId);

  return {
    ...records,
    bestFloor: Math.max(records.bestFloor, state.runStats.deepestFloor),
    bestScore: Math.max(records.bestScore, state.player.score),
    discoveredItems: Array.from(new Set([...records.discoveredItems, ...visibleItems, ...inventoryItems])).filter((id) =>
      ITEM_DEFINITIONS.some((item) => item.id === id),
    ),
    discoveredEnemies: Array.from(new Set([...records.discoveredEnemies, ...visibleEnemies])).filter((id) =>
      ENEMY_DEFINITIONS.some((enemy) => enemy.id === id),
    ),
  };
}

export function recordRunResult(records: Records, result: GameResult): Records {
  return {
    ...records,
    bestFloor: Math.max(records.bestFloor, result.floor),
    clearCount: records.clearCount + (result.outcome === 'clear' ? 1 : 0),
    totalKills: records.totalKills + result.kills,
    bestScore: Math.max(records.bestScore, result.score),
    totalTurns: records.totalTurns + result.turns,
    lastResult: result,
  };
}
