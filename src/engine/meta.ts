// 村（冒険の外）：倉庫・蓄え・図鑑・記録・毎日の挑戦・称号
import { itemDef } from '../content/items';
import { NORMAL_MONSTERS } from '../content/monsters';
import { MODE_FLOORS, TITLES } from '../content/world';
import { buyPrice, hasUnpaid, sellPrice } from './core';
import { createRun } from './run';
import { hashSeed } from './rng';
import type { Item, Run, RunMode } from './types';

export const META_VERSION = 1;
export const STORAGE_MAX = 60;

export interface RunRecord {
  at: string;
  mode: RunMode;
  kind: 'dead' | 'clear' | 'return' | 'quit';
  cause: string;
  floor: number;
  lv: number;
  kills: number;
  turns: number;
  score?: number;
}

export interface DailyRecord { score: number; floor: number; cleared: boolean }

export interface Settings {
  bgm: number;
  se: number;
  /** 敵の動きを速く見せる */
  fast: boolean;
  tiers: boolean;
  text: 's' | 'm' | 'l';
}

export interface Meta {
  v: number;
  /** 村の蓄え（文） */
  gold: number;
  storage: Item[];
  nextUid: number;
  book: { mon: Record<string, { kills: number }>; item: Record<string, true> };
  records: { runs: RunRecord[]; best: Record<RunMode, number>; clears: Record<RunMode, number>; kills: number; plays: number };
  daily: Record<string, DailyRecord>;
  titles: string[];
  deepUnlocked: boolean;
  settings: Settings;
  lastFinalized?: string;
}

export function defaultMeta(): Meta {
  return {
    v: META_VERSION,
    // 最初の旅立ちの支度金
    gold: 500,
    storage: [],
    nextUid: 1,
    book: { mon: {}, item: {} },
    records: { runs: [], best: { main: 0, deep: 0, daily: 0, practice: 0 }, clears: { main: 0, deep: 0, daily: 0, practice: 0 }, kills: 0, plays: 0 },
    daily: {},
    titles: [],
    deepUnlocked: false,
    settings: { bgm: 0.5, se: 0.7, fast: false, tiers: true, text: 'm' },
  };
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function dailySeed(key: string): number {
  return hashSeed('daily', key);
}

/** 冒険に出る。本編だけ倉庫の道具を持ち込める */
export function departure(meta: Meta, mode: RunMode, carryUids: number[], seed: number, dailyKey?: string): Run {
  if (mode === 'deep' && !meta.deepUnlocked) throw new Error('深層はまだ開いていない');
  let carry: Item[] = [];
  if (mode === 'main') {
    carry = meta.storage.filter((i) => carryUids.includes(i.uid)).slice(0, 12);
    meta.storage = meta.storage.filter((i) => !carry.includes(i));
  }
  meta.records.plays += 1;
  const run = createRun({ mode, seed: mode === 'daily' && dailyKey ? dailySeed(dailyKey) : seed, carry, dailyDate: dailyKey });
  return run;
}

export function dailyScore(run: Run): number {
  const p = run.player;
  const cleared = run.end?.kind === 'clear';
  return Math.max(0, Math.round(
    run.floorNo * 120 + run.stats.kills * 12 + p.lv * 25 + Math.min(500, Math.floor(p.gold / 20)) + (cleared ? 2500 - Math.min(1800, Math.floor(run.turn / 2)) : 0),
  ));
}

export interface Summary {
  kind: 'dead' | 'clear' | 'return' | 'quit';
  cause: string;
  floor: number;
  mode: RunMode;
  kept: Item[];
  lost: Item[];
  gold: number;
  score?: number;
  newTitles: string[];
  unlockedDeep: boolean;
  dailyBest?: boolean;
  /** 宿場で預けた物（倒れても届く） */
  deposited: Item[];
  depositGold: number;
  highlights: { kills: number; lv: number; turns: number; maxHit: number; weapon: string | null; allies: number };
}

/** 冒険の終わり：持ち帰り・図鑑・記録・称号 */
export function finishRun(meta: Meta, run: Run, now = new Date()): Summary {
  const end = run.end ?? { kind: 'quit' as const, cause: '中断', floor: run.floorNo };
  const p = run.player;
  // 図鑑
  for (const id of Object.keys(run.stats.seenIds)) meta.book.mon[id] ??= { kills: 0 };
  for (const [id, n] of Object.entries(run.stats.killedIds)) {
    meta.book.mon[id] ??= { kills: 0 };
    meta.book.mon[id].kills += n;
  }
  for (const id of Object.keys(run.known)) meta.book.item[id] = true;
  // 持ち帰り（本編・深層で、帰還か踏破の時だけ）
  const kept: Item[] = [];
  const lost: Item[] = [];
  let gold = 0;
  const bringsBack = (end.kind === 'return' || end.kind === 'clear') && (run.mode === 'main' || run.mode === 'deep');
  if (bringsBack) {
    for (const item of p.inv) {
      if (hasUnpaid(item)) continue;
      const copy = JSON.parse(JSON.stringify(item)) as Item;
      const assign = (i: Item) => { i.uid = meta.nextUid++; for (const c of i.contents ?? []) assign(c); };
      assign(copy);
      copy.known = true;
      if (meta.storage.length < STORAGE_MAX) { meta.storage.push(copy); kept.push(copy); } else lost.push(copy);
    }
    gold = p.gold;
    meta.gold += gold;
  } else {
    lost.push(...p.inv);
  }
  // 宿場の倉庫番に預けた物とお金は、どんな終わり方でも届く
  const deposited: Item[] = [];
  for (const item of run.deposit ?? []) {
    const copy = JSON.parse(JSON.stringify(item)) as Item;
    const assign = (i: Item) => { i.uid = meta.nextUid++; for (const c of i.contents ?? []) assign(c); };
    assign(copy);
    copy.known = true;
    if (meta.storage.length < STORAGE_MAX) { meta.storage.push(copy); deposited.push(copy); } else lost.push(copy);
  }
  const depositGold = run.depositGold ?? 0;
  meta.gold += depositGold;
  const weaponItem = p.inv.find((i) => i.uid === p.eq.weapon);
  const highlights = {
    kills: run.stats.kills, lv: p.lv, turns: run.turn, maxHit: run.stats.maxHit ?? 0, allies: run.stats.allies,
    weapon: weaponItem ? `${itemDef(weaponItem.id).name}${weaponItem.plus ? (weaponItem.plus > 0 ? `+${weaponItem.plus}` : weaponItem.plus) : ''}` : null,
  };
  // 記録
  const rec: RunRecord = { at: now.toISOString(), mode: run.mode, kind: end.kind, cause: end.cause, floor: end.floor, lv: p.lv, kills: run.stats.kills, turns: run.turn };
  let score: number | undefined;
  let dailyBest = false;
  if (run.mode === 'daily' && run.dailyDate) {
    score = dailyScore(run);
    rec.score = score;
    const prev = meta.daily[run.dailyDate];
    // 1日1回の本番：最初の挑戦だけを記録する
    if (!prev) {
      meta.daily[run.dailyDate] = { score, floor: end.floor, cleared: end.kind === 'clear' };
      dailyBest = true;
    }
    const keys = Object.keys(meta.daily).sort();
    while (keys.length > 60) delete meta.daily[keys.shift()!];
  }
  meta.records.runs.unshift(rec);
  meta.records.runs = meta.records.runs.slice(0, 40);
  meta.records.best[run.mode] = Math.max(meta.records.best[run.mode] ?? 0, run.stats.maxFloor);
  if (end.kind === 'clear') meta.records.clears[run.mode] = (meta.records.clears[run.mode] ?? 0) + 1;
  meta.records.kills += run.stats.kills;
  let unlockedDeep = false;
  if (run.mode === 'main' && end.kind === 'clear' && !meta.deepUnlocked) { meta.deepUnlocked = true; unlockedDeep = true; }
  const newTitles = checkTitles(meta, run);
  return { kind: end.kind, cause: end.cause, floor: end.floor, mode: run.mode, kept, lost, gold, score, newTitles, unlockedDeep, dailyBest, deposited, depositGold, highlights };
}

function checkTitles(meta: Meta, run: Run): string[] {
  const has = (id: string) => meta.titles.includes(id);
  const earned: string[] = [];
  const give = (id: string, ok: boolean) => { if (ok && !has(id)) { meta.titles.push(id); earned.push(id); } };
  const floor = run.stats.maxFloor;
  const cleared = run.end?.kind === 'clear';
  give('first_step', true);
  if (run.mode === 'main') {
    give('floor5', floor >= 5);
    give('floor10', floor >= 10);
    give('floor20', floor >= 20);
    give('clear', cleared);
  }
  if (run.mode === 'deep') {
    give('deep30', floor >= 30);
    give('deep60', floor >= 60);
    give('deep99', cleared);
  }
  give('kill100', meta.records.kills >= 100);
  give('kill1000', meta.records.kills >= 1000);
  const gear = [...run.player.inv, ...meta.storage];
  give('synth3', gear.some((i) => (i.seals?.length ?? 0) + (itemDef(i.id).seal ? 1 : 0) >= 3));
  give('plus10', gear.some((i) => (i.plus ?? 0) >= 10));
  give('thief', run.thief);
  give('ally', run.stats.allies > 0);
  give('daily', run.mode === 'daily');
  give('daily_clear', run.mode === 'daily' && cleared);
  give('lv30', run.player.lv >= 30);
  give('rich', meta.gold >= 100000);
  give('book_all', NORMAL_MONSTERS.every((m) => meta.book.mon[m.id]));
  return earned;
}

export function titleName(id: string): string {
  return TITLES.find((t) => t.id === id)?.name ?? id;
}

// ── 村の店 ──

/** 鍛冶屋：倉庫の武器・防具を+1する費用 */
export function forgeCost(item: Item): number | null {
  const cat = itemDef(item.id).cat;
  if (cat !== 'weapon' && cat !== 'armor') return null;
  const plus = Math.max(0, item.plus ?? 0);
  return 400 + plus * 350 + plus * plus * 40;
}

export function forge(meta: Meta, uid: number): string {
  const item = meta.storage.find((i) => i.uid === uid);
  if (!item) return '品物が見つからない。';
  const cost = forgeCost(item);
  if (cost === null) return '武器と防具しか鍛えられない。';
  if ((item.plus ?? 0) >= 30) return 'これ以上は鍛えられない。';
  if (meta.gold < cost) return `蓄えが足りない（${cost}文）。`;
  meta.gold -= cost;
  item.plus = (item.plus ?? 0) + 1;
  item.cursed = false;
  item.known = true;
  return `${itemDef(item.id).name}を+${item.plus}に鍛えた。`;
}

/** よろず屋の品 */
export const VILLAGE_GOODS: { id: string; count?: number }[] = [
  { id: 'f_onigiri' }, { id: 'g_yakusou' }, { id: 'g_daiyakusou' }, { id: 's_shikibetsu' }, { id: 'r_ki', count: 15 }, { id: 'p_hozon' }, { id: 'w_dou' }, { id: 'a_dou' },
];

export function goodsPrice(id: string, count?: number): number {
  const item: Item = { uid: 0, id, count, cap: 4, plus: 0, charges: 0 };
  return Math.round(buyPrice(item) * 1.5);
}

export function buyGoods(meta: Meta, id: string, count?: number): string {
  if (meta.storage.length >= STORAGE_MAX) return '倉庫がいっぱいだ。';
  const price = goodsPrice(id, count);
  if (meta.gold < price) return `蓄えが足りない（${price}文）。`;
  meta.gold -= price;
  const def = itemDef(id);
  const item: Item = { uid: meta.nextUid++, id, known: true };
  if (def.cat === 'weapon' || def.cat === 'armor') { item.plus = 0; item.seals = []; item.cursed = false; }
  if (def.cat === 'pot') { item.cap = 4; item.contents = []; }
  if (def.cat === 'arrow') item.count = count ?? 10;
  meta.storage.push(item);
  return `${def.name}を買った。`;
}

export function sellFromStorage(meta: Meta, uid: number): string {
  const i = meta.storage.findIndex((x) => x.uid === uid);
  if (i < 0) return '品物が見つからない。';
  const [item] = meta.storage.splice(i, 1);
  const price = sellPrice(item);
  meta.gold += price;
  return `${itemDef(item.id).name}を${price}文で売った。`;
}

export function modeFloors(mode: RunMode): number {
  return MODE_FLOORS[mode];
}
