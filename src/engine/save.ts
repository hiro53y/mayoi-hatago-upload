// 保存：冒険の途中（毎ターン）と村のデータ。壊れたデータは読み込まない
import { ITEM_BY_ID } from '../content/items';
import { MON_BY_ID } from '../content/monsters';
import { defaultMeta, META_VERSION, type Meta } from './meta';
import { RUN_VERSION } from './run';
import type { Item, Run } from './types';

export const KEY_RUN = 'fdm2:run';
export const KEY_META = 'fdm2:meta';

export interface KV {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function store(): KV | null {
  try {
    return (globalThis as { localStorage?: KV }).localStorage ?? null;
  } catch {
    return null;
  }
}

export function serializeRun(run: Run): string {
  return JSON.stringify(run);
}

function validItems(items: unknown): boolean {
  if (!Array.isArray(items)) return false;
  return items.every((i) => {
    const item = i as Item;
    return item && typeof item.uid === 'number' && typeof item.id === 'string' && !!ITEM_BY_ID[item.id] && (!item.contents || validItems(item.contents));
  });
}

/** 読み込んだ冒険が、今の版で遊べる形か */
export function validRun(value: unknown): value is Run {
  const run = value as Run;
  if (!run || run.v !== RUN_VERSION) return false;
  if (!run.player || !run.floor || !Array.isArray(run.monsters) || !Array.isArray(run.log)) return false;
  const f = run.floor;
  if (!Array.isArray(f.tiles) || f.tiles.length !== f.w * f.h || !Array.isArray(f.seen) || f.seen.length !== f.tiles.length) return false;
  if (!validItems(run.player.inv) || !validItems(f.items.map((fi) => fi.item))) return false;
  if (!run.monsters.every((m) => !!MON_BY_ID[m.id])) return false;
  for (const n of [run.player.hp, run.player.maxHp, run.player.lv, run.player.hunger, run.rng, run.turn, run.floorNo]) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return false;
  }
  return true;
}

export function deserializeRun(text: string | null): Run | null {
  if (!text) return null;
  try {
    const run = JSON.parse(text) as unknown;
    return validRun(run) ? run : null;
  } catch {
    return null;
  }
}

export function saveRun(run: Run | null, kv: KV | null = store()) {
  if (!kv) return;
  try {
    if (!run || run.end) kv.removeItem(KEY_RUN);
    else kv.setItem(KEY_RUN, serializeRun(run));
  } catch {
    // 容量不足などで保存できなくても遊びは続ける
  }
}

export function loadRun(kv: KV | null = store()): Run | null {
  if (!kv) return null;
  try {
    return deserializeRun(kv.getItem(KEY_RUN));
  } catch {
    return null;
  }
}

export function saveMeta(meta: Meta, kv: KV | null = store()) {
  if (!kv) return;
  try {
    kv.setItem(KEY_META, JSON.stringify(meta));
  } catch {
    // 保存できなくても遊びは続ける
  }
}

export function loadMeta(kv: KV | null = store()): Meta {
  const base = defaultMeta();
  if (!kv) return base;
  try {
    const raw = kv.getItem(KEY_META);
    if (!raw) return base;
    const meta = JSON.parse(raw) as Meta;
    if (!meta || meta.v !== META_VERSION || !validItems(meta.storage)) return base;
    // 足りない項目は既定値で補う
    return {
      ...base,
      ...meta,
      book: { ...base.book, ...meta.book },
      records: { ...base.records, ...meta.records, best: { ...base.records.best, ...meta.records?.best }, clears: { ...base.records.clears, ...meta.records?.clears } },
      settings: { ...base.settings, ...meta.settings },
    };
  } catch {
    return base;
  }
}
