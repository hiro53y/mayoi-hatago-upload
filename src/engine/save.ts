// 保存と復元。読み込み時はデータを消さず、終了処理は村への反映後にだけ片付ける。
import { ITEM_BY_ID } from '../content/items';
import { MON_BY_ID } from '../content/monsters';
import { TRAP_BY_ID } from '../content/world';
import { defaultMeta, finishRun, META_VERSION, type Meta, type Summary } from './meta';
import { RUN_VERSION } from './run';
import type { Item, Run } from './types';

export const KEY_RUN = 'fdm2:run';
export const KEY_META = 'fdm2:meta';
const JOURNAL = 'fdm2:restore-journal';
export interface KV { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
type Obj = Record<string, any>;
const obj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const int = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => num(v) && Number.isSafeInteger(v) && v >= min && v <= max;
const itemId = (id: unknown): id is string => typeof id === 'string' && Object.hasOwn(ITEM_BY_ID, id);
const monId = (id: unknown): id is string => typeof id === 'string' && Object.hasOwn(MON_BY_ID, id);
const trapId = (id: unknown): id is string => typeof id === 'string' && Object.hasOwn(TRAP_BY_ID, id);
const nums = (o: Obj, keys: string[]) => keys.every((k) => num(o[k]));
const modes = ['main', 'deep', 'daily', 'practice'];
const boolMap = (v: unknown, valid: (key: string) => boolean) => obj(v) && Object.entries(v).every(([k, x]) => valid(k) && x === true);
const status = (s: unknown) => obj(s) && Object.entries(s).every(([k, v]) =>
  ['sealed', 'bond', 'weak'].includes(k) ? typeof v === 'boolean' :
    ['sleep', 'confuse', 'paralyze', 'slow', 'fast', 'blind', 'stuck', 'invincible', 'hidden', 'decoy'].includes(k) && int(v));

function validItems(items: unknown, ids = new Set<number>(), depth = 0): items is Item[] {
  if (!Array.isArray(items) || items.length > 10000 || depth > 32) return false;
  return items.every((i) => {
    if (!obj(i) || !int(i.uid, 1) || ids.has(i.uid) || !itemId(i.id)) return false;
    ids.add(i.uid);
    if (['plus', 'charges', 'count', 'cap'].some((k) => i[k] !== undefined && !int(i[k], k === 'plus' ? -99999 : 0))) return false;
    if (['cursed', 'known', 'shop'].some((k) => i[k] !== undefined && typeof i[k] !== 'boolean')) return false;
    if (i.seals !== undefined && (!Array.isArray(i.seals) || !i.seals.every((s: unknown) => typeof s === 'string'))) return false;
    if (i.contents !== undefined && (ITEM_BY_ID[i.id].cat !== 'pot' || !validItems(i.contents, ids, depth + 1))) return false;
    return true;
  });
}

export function validRun(value: unknown): value is Run {
  try {
    const r = value as Obj;
    if (!obj(r) || r.v !== RUN_VERSION || !modes.includes(r.mode) || !obj(r.player) || !obj(r.floor) || !obj(r.stats)) return false;
    if (!nums(r, ['seed', 'rng', 'turn', 'floorNo', 'lastFloor', 'nextUid', 'spawnIn']) || !int(r.floorNo, 1, 99) || !int(r.nextUid, 1) || !int(r.turn) || !int(r.lastFloor, 1, 99) || r.floorNo > r.lastFloor) return false;
    const p = r.player, f = r.floor;
    if (!int(f.w, 3, 256) || !int(f.h, 3, 256) || !int(f.band, 0, 5) || !int(f.no, 1, 99) || f.no !== r.floorNo) return false;
    const pos = (v: unknown) => obj(v) && int(v.x, 0, f.w - 1) && int(v.y, 0, f.h - 1);
    const size = f.w * f.h;
    if (!Array.isArray(f.tiles) || f.tiles.length !== size || !f.tiles.every((v: unknown) => int(v, 0, 4))) return false;
    if (!Array.isArray(f.seen) || f.seen.length !== size || !f.seen.every((v: unknown) => int(v, 0, 1))) return false;
    if (!Array.isArray(f.rooms) || !f.rooms.every((v: unknown) => pos(v) && obj(v) && int(v.id) && int(v.w, 1, f.w) && int(v.h, 1, f.h) && v.x + v.w <= f.w && v.y + v.h <= f.h && ['normal', 'shop', 'house', 'boss'].includes(v.kind) && typeof v.lit === 'boolean')) return false;
    const roomIds = new Set(f.rooms.map((v: Obj) => v.id));
    if (!Array.isArray(f.roomOf) || f.roomOf.length !== size || !f.roomOf.every((v: unknown) => v === -1 || int(v) && roomIds.has(v))) return false;
    if (f.stairs !== null && !pos(f.stairs)) return false;
    if (!['normal', 'big', 'boss', 'town'].includes(f.kind) || !nums(f, ['house', 'turns']) || ['dark', 'fog', 'houseAwake'].some((k) => typeof f[k] !== 'boolean')) return false;
    if (f.shop !== null && (!obj(f.shop) || !roomIds.has(f.shop.room) || !int(f.shop.keeper, 1))) return false;
    if (!pos(p) || !int(p.dir, 0, 7) || !status(p.st) || !obj(p.eq) || !nums(p, ['hp', 'maxHp', 'lv', 'exp', 'str', 'maxStr', 'hunger', 'maxHunger', 'gold', 'regen', 'hungerAcc']) || p.maxHp <= 0 || p.hp < 0 || p.hp > p.maxHp || p.lv < 1 || p.hunger < 0 || p.maxHunger <= 0 || p.gold < 0) return false;
    const ids = new Set<number>();
    if (!validItems(p.inv, ids) || !Array.isArray(f.items) || !f.items.every((v: unknown) => pos(v) && obj(v) && validItems([v.item], ids))) return false;
    if (Object.entries(p.eq).some(([k, uid]) => !['weapon', 'armor', 'charm', 'arrow'].includes(k) || !p.inv.some((i: Item) => i.uid === uid && ITEM_BY_ID[i.id].cat === k))) return false;
    if (r.deposit !== undefined && !validItems(r.deposit, ids)) return false;
    if (r.depositGold !== undefined && !int(r.depositGold)) return false;
    if (!Array.isArray(r.monsters)) return false;
    const actorIds = ids;
    for (const m of r.monsters) {
      if (!obj(m) || !monId(m.id) || !pos(m) || !int(m.uid, 1) || actorIds.has(m.uid) || !int(m.dir, 0, 7) || !nums(m, ['hp', 'maxHp']) || m.maxHp <= 0 || !status(m.st) || typeof m.awake !== 'boolean') return false;
      actorIds.add(m.uid);
      if (m.stolen !== undefined && !validItems(m.stolen, ids)) return false;
      if (m.goal != null && !pos(m.goal) || m.wander != null && !pos(m.wander)) return false;
      if (m.disguise !== undefined && !itemId(m.disguise)) return false;
      if (m.role !== undefined && !['keeper', 'npc', 'boss'].includes(m.role)) return false;
      if (m.npc !== undefined && !['inn', 'bank', 'seer'].includes(m.npc)) return false;
      if (['bonus', 'stolenGold', 'scale', 'cd'].some((k) => m[k] !== undefined && !num(m[k]))) return false;
    }
    if (!Array.isArray(f.traps) || !f.traps.every((v: unknown) => pos(v) && obj(v) && trapId(v.id) && typeof v.found === 'boolean')) return false;
    if (!boolMap(r.known, (id) => itemId(id)) || !obj(r.fake) || !obj(r.named) || ![r.fake, r.named].every((v) => Object.entries(v).every(([k, s]) => itemId(k) && typeof s === 'string'))) return false;
    if (!nums(r.stats, ['kills', 'turns', 'maxFloor', 'itemsUsed', 'synth', 'stolen', 'allies']) || !obj(r.stats.killedIds) || !Object.entries(r.stats.killedIds).every(([k, n]) => monId(k) && int(n)) || !boolMap(r.stats.seenIds, (id) => monId(id))) return false;
    if (!Array.isArray(r.log) || !r.log.every((l: unknown) => obj(l) && typeof l.t === 'string' && (l.c === undefined || ['good', 'bad', 'info', 'item', 'warn'].includes(l.c)))) return false;
    if (typeof r.thief !== 'boolean' || r.banned !== undefined && !boolMap(r.banned, (id) => monId(id))) return false;
    if (r.end !== null && (!obj(r.end) || !['dead', 'clear', 'return', 'quit'].includes(r.end.kind) || typeof r.end.cause !== 'string' || !int(r.end.floor, 1, 99))) return false;
    if (r.prompt !== null) {
      const q = r.prompt;
      if (!obj(q)) return false;
      if (q.kind === 'npc') { if (!['inn', 'bank', 'seer'].includes(q.who) || !int(q.cost)) return false; }
      else if (q.kind === 'pay') { if (!int(q.amount) || !int(q.dir, 0, 7)) return false; }
      else if (q.kind === 'sell') { if (!int(q.amount) || !int(q.itemUid, 1)) return false; }
      else return false;
    }
    if (r.completionId !== undefined && typeof r.completionId !== 'string') return false;
    return [...ids, ...actorIds].every((id) => id < r.nextUid);
  } catch { return false; }
}

export function deserializeRun(text: string | null): Run | null {
  if (!text) return null;
  try {
    const r = JSON.parse(text);
    // 2.0に存在した番人だけを互換処理する。不明な敵を黙って消さない。
    if (obj(r) && Array.isArray(r.monsters)) r.monsters = r.monsters.filter((m: unknown) => !(obj(m) && m.id === 'guard'));
    return validRun(r) ? r : null;
  } catch { return null; }
}
export function serializeRun(run: Run): string { return JSON.stringify(run); }

export function deserializeMeta(text: string | null): Meta | null {
  if (!text) return null;
  try {
    const m = JSON.parse(text);
    if (!obj(m) || m.v !== META_VERSION || !int(m.gold) || !int(m.nextUid, 1) || !validItems(m.storage) || !obj(m.book) || !obj(m.book.mon) || !boolMap(m.book.item, (id) => itemId(id)) || !obj(m.records) || !Array.isArray(m.records.runs) || !obj(m.records.best) || !obj(m.records.clears) || !obj(m.daily) || !Array.isArray(m.titles) || !m.titles.every((t: unknown) => typeof t === 'string') || typeof m.deepUnlocked !== 'boolean') return null;
    if (!Object.entries(m.book.mon).every(([id, b]) => monId(id) && obj(b) && int(b.kills))) return null;
    if (!int(m.records.kills) || !int(m.records.plays) || ![m.records.best, m.records.clears].every((v) => Object.entries(v).every(([k, n]) => modes.includes(k) && int(n)))) return null;
    if (!m.records.runs.every((v: unknown) => obj(v) && typeof v.at === 'string' && modes.includes(v.mode) && ['dead', 'clear', 'return', 'quit'].includes(v.kind) && typeof v.cause === 'string' && ['floor', 'lv', 'kills', 'turns'].every((k) => int(v[k])) && (v.score === undefined || int(v.score)))) return null;
    if (!Object.entries(m.daily).every(([day, v]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && obj(v) && int(v.score) && int(v.floor) && typeof v.cleared === 'boolean')) return null;
    const s = m.settings;
    if (!obj(s) || !num(s.bgm) || s.bgm < 0 || s.bgm > 1 || !num(s.se) || s.se < 0 || s.se > 1 || typeof s.fast !== 'boolean' || !['s', 'm', 'l'].includes(s.text) || s.tiers !== undefined && typeof s.tiers !== 'boolean') return null;
    if (m.lastFinalized !== undefined && typeof m.lastFinalized !== 'string') return null;
    const ids = new Set<number>();
    if (!validItems(m.storage, ids) || [...ids].some((id) => id >= m.nextUid)) return null;
    const base = defaultMeta();
    return { ...base, ...m, settings: { ...base.settings, ...s }, records: { ...base.records, ...m.records, best: { ...base.records.best, ...m.records.best }, clears: { ...base.records.clears, ...m.records.clears } } } as Meta;
  } catch { return null; }
}

let problem = '';
const failures = new Set<string>();
export function storage(): KV | null { try { return globalThis.localStorage ?? null; } catch { return null; } }
export function saveProblem() { return problem; }
function report(key: string, ok: boolean) {
  if (ok) failures.delete(key); else failures.add(key);
  problem = failures.size ? '保存できていません。容量やブラウザーの設定をご確認ください。再試行するか、バックアップを書き出してください。' : '';
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('fdm-save-status'));
  return ok;
}
function put(key: string, value: string | null, kv: KV | null) {
  if (!kv) return report(key, false);
  try { if (value === null) kv.removeItem(key); else kv.setItem(key, value); return report(key, true); }
  catch { return report(key, false); }
}
export function saveRun(run: Run | null, kv: KV | null = storage()): boolean { return put(KEY_RUN, run ? serializeRun(run) : null, kv); }
export function saveMeta(meta: Meta, kv: KV | null = storage()): boolean { return put(KEY_META, JSON.stringify(meta), kv); }
export function loadRun(kv: KV | null = storage()): Run | null { try { return deserializeRun(kv?.getItem(KEY_RUN) ?? null); } catch { return null; } }
export function loadMeta(kv: KV | null = storage()): Meta { try { return deserializeMeta(kv?.getItem(KEY_META) ?? null) ?? defaultMeta(); } catch { return defaultMeta(); } }

export function recoveryProblem(kv: KV | null = storage()): string {
  if (!kv) return '保存場所を利用できません。ブラウザーの設定をご確認ください。';
  try {
    if (kv.getItem(JOURNAL)) return '復元が完了していません。復元前のデータに戻してください。';
    const r = kv.getItem(KEY_RUN), m = kv.getItem(KEY_META);
    return (r !== null && !deserializeRun(r)) || (m !== null && !deserializeMeta(m)) ? '保存データを安全に読み込めませんでした。元のデータは残しています。バックアップを書き出すか、有効なバックアップから復元してください。' : '';
  } catch { return '保存場所を読み取れませんでした。'; }
}

export interface Backup { format: 'fushigina-dungeon-modoki'; version: 1; exportedAt: string; run: Run | null; meta: Meta }
export function exportBackup(meta: Meta, run: Run | null): string { return JSON.stringify({ format: 'fushigina-dungeon-modoki', version: 1, exportedAt: new Date().toISOString(), run, meta } satisfies Backup, null, 2); }
export function parseBackup(text: string): Backup | null {
  if (text.length > 10_000_000) return null;
  try {
    const b = JSON.parse(text);
    if (!obj(b) || b.format !== 'fushigina-dungeon-modoki' || b.version !== 1 || typeof b.exportedAt !== 'string' || !Number.isFinite(Date.parse(b.exportedAt))) return null;
    const meta = deserializeMeta(JSON.stringify(b.meta));
    const run = b.run === null ? null : deserializeRun(JSON.stringify(b.run));
    return meta && (b.run === null || run) ? { ...b, meta, run } as Backup : null;
  } catch { return null; }
}
export function exportRaw(kv: KV | null = storage()): string {
  return JSON.stringify({ format: 'fdm-recovery-raw', exportedAt: new Date().toISOString(), run: kv?.getItem(KEY_RUN), meta: kv?.getItem(KEY_META), journal: kv?.getItem(JOURNAL) }, null, 2);
}
function restoreValues(kv: KV, values: { run: string | null; meta: string | null }) {
  for (const [key, value] of [[KEY_RUN, values.run], [KEY_META, values.meta]]) {
    if (value === null) kv.removeItem(key!); else kv.setItem(key!, value!);
  }
}
export function rollbackRestore(kv: KV | null = storage()): boolean {
  if (!kv) return false;
  try {
    const raw = kv.getItem(JOURNAL);
    if (!raw) return true;
    const prev = JSON.parse(raw);
    if (!obj(prev) || ![prev.run, prev.meta].every((x) => x === null || typeof x === 'string')) return false;
    restoreValues(kv, prev as { run: string | null; meta: string | null });
    kv.removeItem(JOURNAL);
    return true;
  } catch { return false; }
}
export function restoreBackup(b: Backup, kv: KV | null = storage()): boolean {
  if (!kv || !parseBackup(JSON.stringify(b))) return false;
  try {
    if (kv.getItem(JOURNAL)) return false;
    const prev = { run: kv.getItem(KEY_RUN), meta: kv.getItem(KEY_META) };
    kv.setItem(JOURNAL, JSON.stringify(prev));
    restoreValues(kv, { run: b.run ? serializeRun(b.run) : null, meta: JSON.stringify(b.meta) });
    kv.removeItem(JOURNAL);
    failures.clear(); report('restore', true);
    return true;
  } catch { rollbackRestore(kv); report('restore', false); return false; }
}

export function finalizeRun(meta: Meta, run: Run, kv: KV | null = storage()): { meta: Meta; summary: Summary | null; ok: boolean } {
  if (!run.end) return { meta, summary: null, ok: false };
  if (!run.completionId) run.completionId = `${run.mode}:${run.seed}:${run.turn}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  if (!saveRun(run, kv)) return { meta, summary: null, ok: false };
  if (meta.lastFinalized === run.completionId) return { meta, summary: null, ok: saveRun(null, kv) };
  const next: Meta = JSON.parse(JSON.stringify(meta));
  const summary = finishRun(next, run);
  next.lastFinalized = run.completionId;
  if (!saveMeta(next, kv)) return { meta, summary: null, ok: false };
  // 村の保存後に冒険を消す。ここで閉じても識別子により二重反映しない。
  const ok = saveRun(null, kv);
  return { meta: next, summary, ok };
}
