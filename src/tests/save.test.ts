import { createNewGame } from '../game/gameState';
import { clearProgress, loadProgress, loadRecords, saveProgress } from '../game/save';
import { STORAGE_KEYS } from '../game/constants';
import { assert, equal } from './test-utils';

function installMemoryStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  });
  return storage;
}

export function runSaveTests(): void {
  installMemoryStorage();
  localStorage.setItem(STORAGE_KEYS.records, '{broken');
  const records = loadRecords();
  equal(records.totalRuns, 0, 'corrupted records should reset total runs');
  equal(records.bestScore, 0, 'corrupted records should reset best score');

  installMemoryStorage();
  const state = createNewGame(999);
  saveProgress(state);
  equal(loadProgress()?.runId, state.runId, 'saved progress should reload');
  clearProgress();
  assert(loadProgress() === null, 'cleared progress should be null');
}
