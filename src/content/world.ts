// 罠・階層の帯・称号
import type { RunMode } from '../engine/types';

export interface TrapDef { id: string; name: string; weight: number; minFloor: number; desc: string }

export const TRAPS: TrapDef[] = [
  { id: 'pit', name: '落とし穴', weight: 10, minFloor: 1, desc: '下の階へ落ちる。' },
  { id: 'mine', name: '地雷', weight: 5, minFloor: 4, desc: '爆発して HP が半分になり、周りの道具も吹き飛ぶ。' },
  { id: 'poison', name: '毒矢の罠', weight: 7, minFloor: 2, desc: '毒矢が飛んできて力が下がる。' },
  { id: 'arrow', name: '矢の罠', weight: 8, minFloor: 1, desc: '矢が飛んでくる。' },
  { id: 'sleep', name: '眠りの罠', weight: 7, minFloor: 2, desc: '眠りの霧が噴き出す。' },
  { id: 'rust', name: '錆の罠', weight: 6, minFloor: 3, desc: '装備が錆びる。' },
  { id: 'hunger', name: '腹減りの罠', weight: 6, minFloor: 2, desc: 'お腹が減る。' },
  { id: 'summon', name: '呼び出しの罠', weight: 5, minFloor: 3, desc: '敵が周りに現れる。' },
  { id: 'warp', name: 'ワープの罠', weight: 8, minFloor: 1, desc: 'どこかへ飛ばされる。' },
  { id: 'spin', name: '回転の罠', weight: 7, minFloor: 1, desc: '目が回って混乱する。' },
  { id: 'gust', name: '突風の罠', weight: 5, minFloor: 3, desc: '吹き飛ばされる。' },
  { id: 'slow', name: '鈍足の罠', weight: 5, minFloor: 4, desc: '足が遅くなる。' },
  { id: 'bear', name: 'トラバサミ', weight: 6, minFloor: 2, desc: 'しばらく動けなくなる。' },
  { id: 'curse', name: '呪いの罠', weight: 4, minFloor: 5, desc: '持ち物が1つ呪われる。' },
];

export const TRAP_BY_ID: Record<string, TrapDef> = Object.fromEntries(TRAPS.map((t) => [t.id, t]));

export interface Band {
  name: string;
  /** 地形の色 */
  floor: string;
  floorDark: string;
  wall: string;
  wallTop: string;
  accent: string;
  /** 水路・溶岩の帯 */
  liquid: 'water' | 'lava' | null;
}

export const BANDS: Band[] = [
  { name: '竹林の小径', floor: '#6f7b3a', floorDark: '#58622d', wall: '#2f4a22', wallTop: '#4e7a32', accent: '#9fc260', liquid: null },
  { name: '苔むす洞窟', floor: '#5d5a52', floorDark: '#4a4842', wall: '#2c2a27', wallTop: '#55504a', accent: '#8fa86b', liquid: null },
  { name: '水底の回廊', floor: '#4f6670', floorDark: '#405560', wall: '#1f3240', wallTop: '#36586b', accent: '#7fc8e0', liquid: 'water' },
  { name: '溶岩の坑道', floor: '#6a4a3a', floorDark: '#563b2e', wall: '#2e1b16', wallTop: '#5a2f22', accent: '#ff8a3c', liquid: 'lava' },
  { name: '朽ちた墓所', floor: '#5b5566', floorDark: '#4a4555', wall: '#24202c', wallTop: '#433b52', accent: '#b49ae0', liquid: null },
  { name: '天守への道', floor: '#7a6448', floorDark: '#66533b', wall: '#2e2318', wallTop: '#6b4a2a', accent: '#e8c070', liquid: null },
];

/** 何階まであるか */
export const MODE_FLOORS: Record<RunMode, number> = { main: 30, deep: 99, daily: 10, practice: 3 };

export const MODE_NAME: Record<RunMode, string> = { main: '本編・天守への道', deep: '深層・奈落の九十九階', daily: '毎日の挑戦', practice: '道場の練習迷宮' };

/** 階 → 帯（見た目と曲） */
export function bandOf(mode: RunMode, floor: number): number {
  if (mode === 'deep') return Math.floor(((floor - 1) % 30) / 5);
  if (mode === 'daily') return Math.min(5, Math.floor((floor - 1) / 2));
  if (mode === 'practice') return 0;
  return Math.min(5, Math.floor((floor - 1) / 5));
}

/** 階 → 敵の強さの基準になる階 */
export function dangerOf(mode: RunMode, floor: number): number {
  if (mode === 'daily') return Math.round(floor * 1.6);
  if (mode === 'practice') return 1;
  return floor;
}

export interface TitleDef { id: string; name: string; desc: string }

export const TITLES: TitleDef[] = [
  { id: 'first_step', name: '旅立ち', desc: '初めて冒険に出た' },
  { id: 'floor5', name: '竹林を抜けし者', desc: '本編で5階に着いた' },
  { id: 'floor10', name: '洞窟の探索者', desc: '本編で10階に着いた' },
  { id: 'floor20', name: '溶岩渡り', desc: '本編で20階に着いた' },
  { id: 'clear', name: '天守の覇者', desc: '本編を踏破した' },
  { id: 'deep30', name: '奈落の旅人', desc: '深層で30階に着いた' },
  { id: 'deep60', name: '奈落の古強者', desc: '深層で60階に着いた' },
  { id: 'deep99', name: '九十九の極み', desc: '深層の99階を踏破した' },
  { id: 'kill100', name: '百鬼退治', desc: '敵を合計100体倒した' },
  { id: 'kill1000', name: '千鬼退治', desc: '敵を合計1000体倒した' },
  { id: 'synth3', name: '名工', desc: '印を3つ以上付けた武器か防具を作った' },
  { id: 'plus10', name: '鍛冶の申し子', desc: '+10以上の武器か防具を手にした' },
  { id: 'thief', name: '大泥棒', desc: '店から品物を持ち逃げした' },
  { id: 'ally', name: '妖怪使い', desc: '敵を仲間にした' },
  { id: 'house', name: '修羅場', desc: 'モンスターハウスを生き延びた' },
  { id: 'daily', name: '日々精進', desc: '毎日の挑戦を初めて遊んだ' },
  { id: 'daily_clear', name: '今日の勝者', desc: '毎日の挑戦を踏破した' },
  { id: 'lv30', name: '歴戦の旅人', desc: 'レベル30に達した' },
  { id: 'rich', name: '長者', desc: '村の蓄えが10万文を超えた' },
  { id: 'book_all', name: '博物学者', desc: '図鑑の敵をすべて見た' },
];
