// 絵の読み込み：維持する既存 PNG と、画風を揃えた v2.2 PNG。色違い（色相・明るさ）は読み込み時に作って使い回す
import { itemDef } from '../content/items';
import { monDef } from '../content/monsters';

const PNG = [
  'player-down', 'player-up', 'player-left', 'player-right', 'enemy-tanuki', 'enemy-kitsune', 'enemy-armor', 'enemy-onibi', 'enemy-kappa',
  'enemy-rust-armor', 'enemy-shadow', 'item-herb', 'item-food', 'item-weapon', 'item-armor', 'item-offense', 'item-support', 'stairs',
  'trap-spike', 'trap-net', 'trap-fire',
];
const VERSION = '20261015-v22';
const NEW_PNG = ['nekomata', 'rokurokubi', 'chouchin', 'honehoushi', 'tsuchigumo', 'baku', 'tengu', 'gaki', 'yukionna', 'keeper', 'inn', 'bank', 'seer', 'oni', 'item-staff', 'item-pot', 'item-arrow', 'item-gold', 'item-sanctuary', 'trap-warp', 'trap-spin', 'trap-sleep', 'trap-rust', 'trap-hunger', 'trap-summon', 'trap-gust', 'trap-slow', 'trap-curse', 'trap-poison', 'trap-arrow'];
export const SPRITE_PX = 128;

const images = new Map<string, HTMLImageElement>();
const cache = new Map<string, HTMLCanvasElement>();
let loading: Promise<void> | null = null;

function loadImage(key: string, src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { images.set(key, img); resolve(); };
    img.onerror = () => resolve();
    img.src = src;
  });
}

/** すべての絵を読み込む（1回だけ） */
export function loadSprites(): Promise<void> {
  if (loading) return loading;
  const jobs: Promise<void>[] = [];
  for (const name of PNG) jobs.push(loadImage(name, `/assets/sprites/v2/${name}.png?v=${VERSION}`));
  for (const name of NEW_PNG) jobs.push(loadImage(name, `/assets/sprites/v22/${name}.png?v=${VERSION}`));
  loading = Promise.all(jobs).then(() => undefined);
  return loading;
}

/** 絵（色違いを含む）を 128px のキャンバスで返す */
export function sprite(key: string, hue = 0, tone = 1): HTMLCanvasElement | null {
  const ck = `${key}|${hue}|${tone}`;
  const hit = cache.get(ck);
  if (hit) return hit;
  const img = images.get(key);
  if (!img) return null;
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE_PX;
  const g = c.getContext('2d')!;
  if (hue || tone !== 1) g.filter = `hue-rotate(${hue}deg) brightness(${tone}) saturate(${hue ? 1.15 : 1})`;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, SPRITE_PX, SPRITE_PX);
  g.filter = 'none';
  cache.set(ck, c);
  return c;
}

export function monsterSprite(id: string): HTMLCanvasElement | null {
  const def = monDef(id);
  return sprite(def.sprite, def.hue, def.tone);
}

const CAT_SPRITE: Record<string, string> = {
  weapon: 'item-weapon', armor: 'item-armor', grass: 'item-herb', food: 'item-food', scroll: 'item-offense', charm: 'item-support',
  staff: 'item-staff', pot: 'item-pot', arrow: 'item-arrow', gold: 'item-gold',
};

/** 種類ごとの色合い（同じ絵でも見分けやすく） */
const CAT_HUE: Record<string, number> = { weapon: 0, armor: 0, grass: 0, food: 0, scroll: 0, charm: 0, staff: 0, pot: 0, arrow: 0, gold: 0 };

export function itemSprite(id: string): HTMLCanvasElement | null {
  const def = itemDef(id);
  if (id === 's_seiiki') return sprite('item-sanctuary');
  return sprite(CAT_SPRITE[def.cat] ?? 'item-support', CAT_HUE[def.cat] ?? 0);
}

const TRAP_SPRITE: Record<string, string> = {
  pit: 'trap-net', bear: 'trap-spike', mine: 'trap-fire', arrow: 'trap-arrow', poison: 'trap-poison', warp: 'trap-warp', spin: 'trap-spin',
  sleep: 'trap-sleep', rust: 'trap-rust', hunger: 'trap-hunger', summon: 'trap-summon', gust: 'trap-gust', slow: 'trap-slow', curse: 'trap-curse',
};

export function trapSprite(id: string): HTMLCanvasElement | null {
  return sprite(TRAP_SPRITE[id] ?? 'trap-net');
}

export function playerSprite(dir: number): HTMLCanvasElement | null {
  // 8方向 → 4方向の絵
  const key = dir === 0 ? 'player-up' : dir === 4 ? 'player-down' : dir <= 3 ? 'player-right' : 'player-left';
  return sprite(key);
}

/** 図鑑やメニュー用の画像URL（キャンバスから作る） */
export function spriteUrl(c: HTMLCanvasElement | null): string {
  return c ? c.toDataURL('image/png') : '';
}
