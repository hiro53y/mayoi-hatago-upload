import type { EnemyDefinition } from './types';

export const PLAYER_BASE = {
  maxHp: 30,
  attack: 6,
  defense: 2,
  hunger: 100,
};

export const ENEMY_DEFINITIONS: EnemyDefinition[] = [
  {
    id: 'mayoi-tanuki',
    name: '迷い狸',
    minFloor: 1,
    hp: 13,
    attack: 4,
    defense: 1,
    exp: 6,
    score: 80,
    awakeRange: 5,
  },
  {
    id: 'kusakage-kitsune',
    name: '草陰狐',
    minFloor: 2,
    hp: 16,
    attack: 5,
    defense: 1,
    exp: 9,
    score: 110,
    awakeRange: 7,
  },
  {
    id: 'tsuchikure-musha',
    name: '土くれ武者',
    minFloor: 3,
    hp: 22,
    attack: 6,
    defense: 4,
    exp: 13,
    score: 150,
    awakeRange: 5,
    moveEvery: 2,
  },
  {
    id: 'akari-onibi',
    name: '灯り鬼火',
    minFloor: 4,
    hp: 18,
    attack: 5,
    defense: 2,
    exp: 14,
    score: 160,
    awakeRange: 9,
    special: 'poison',
  },
  {
    id: 'harapeko-kappa',
    name: '腹ぺこ河童',
    minFloor: 5,
    hp: 24,
    attack: 7,
    defense: 2,
    exp: 18,
    score: 210,
    awakeRange: 6,
    special: 'hunger',
  },
  {
    id: 'sabi-yoroi',
    name: '錆び鎧',
    minFloor: 7,
    hp: 32,
    attack: 9,
    defense: 5,
    exp: 25,
    score: 300,
    awakeRange: 5,
  },
  {
    id: 'kage-boshi',
    name: '影法師',
    minFloor: 8,
    hp: 28,
    attack: 8,
    defense: 3,
    exp: 28,
    score: 340,
    awakeRange: 7,
    special: 'blind',
  },
];

export function enemyCountForFloor(floor: number): number {
  if (floor <= 1) return 3;
  if (floor === 2) return 4;
  if (floor === 3) return 5;
  return Math.min(8, 5 + Math.floor((floor - 4) / 2));
}

export function itemCountForFloor(floor: number): number {
  if (floor <= 1) return 4;
  if (floor <= 5) return 4 + (floor % 3);
  return 3 + (floor % 3);
}
