export interface Rng {
  readonly state: number;
  next: () => number;
  int: (min: number, max: number) => number;
  chance: (probability: number) => boolean;
  pick: <T>(items: T[]) => T;
}

export function hashSeed(input: string | number): number {
  const text = String(input);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    get state() {
      return state >>> 0;
    },
    next,
    int(min: number, max: number) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    chance(probability: number) {
      return next() < probability;
    },
    pick<T>(items: T[]) {
      return items[Math.floor(next() * items.length)];
    },
  };
}

export function randomId(prefix: string, rng: Rng): string {
  return `${prefix}-${Math.floor(rng.next() * 36 ** 8).toString(36).padStart(8, '0')}`;
}
