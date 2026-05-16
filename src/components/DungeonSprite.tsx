import type { Direction, ItemCategory, TrapType } from '../game/types';

interface Props {
  kind: 'player' | 'enemy' | 'item' | 'stairs' | 'trap';
  enemyKind?: string;
  itemCategory?: ItemCategory;
  trapType?: TrapType;
  playerFacing?: Direction;
  enemyFacingRight?: boolean;
}

const SPRITE_BASE = '/assets/sprites/';
const SPRITE_VERSION = '20260516-linefix';

const ENEMY_SPRITES: Record<string, string> = {
  'mayoi-tanuki': 'enemy-tanuki.png',
  'kusakage-kitsune': 'enemy-kitsune.png',
  'tsuchikure-musha': 'enemy-armor.png',
  'akari-onibi': 'enemy-onibi.png',
  'harapeko-kappa': 'enemy-kappa.png',
  'sabi-yoroi': 'enemy-rust-armor.png',
  'kage-boshi': 'enemy-shadow.png',
};

const ITEM_SPRITES: Record<ItemCategory, string> = {
  healing: 'item-herb.png',
  food: 'item-food.png',
  offense: 'item-offense.png',
  support: 'item-support.png',
  weapon: 'item-weapon.png',
  armor: 'item-armor.png',
};

const TRAP_SPRITES: Record<TrapType, string> = {
  'slow-mud': 'trap-set.png',
  'hunger-floor': 'trap-set.png',
  'snare-bell': 'trap-set.png',
};

const PLAYER_SPRITES: Record<Direction, string> = {
  up: 'player-up.png',
  down: 'player-down.png',
  left: 'player-left.png',
  right: 'player-right.png',
};

function spriteSrc(fileName: string) {
  return `${SPRITE_BASE}${fileName}?v=${SPRITE_VERSION}`;
}

export default function DungeonSprite({ kind, enemyKind, itemCategory, trapType, playerFacing, enemyFacingRight }: Props) {
  let className = 'game-sprite';
  let fileName = PLAYER_SPRITES[playerFacing ?? 'down'];

  if (kind === 'player') {
    className += ' player-sprite art-sprite';
  } else if (kind === 'stairs') {
    className += ' stairs-sprite art-sprite';
    fileName = 'stairs.png';
  } else if (kind === 'trap') {
    className += ' trap-sprite art-sprite';
    fileName = TRAP_SPRITES[trapType ?? 'slow-mud'];
  } else if (kind === 'item') {
    className += ' item-sprite art-sprite';
    fileName = ITEM_SPRITES[itemCategory ?? 'support'];
  } else {
    className += ' enemy-sprite art-sprite';
    if (enemyFacingRight) className += ' enemy-facing-right';
    fileName = ENEMY_SPRITES[enemyKind ?? 'mayoi-tanuki'] ?? ENEMY_SPRITES['mayoi-tanuki'];
  }

  return <img className={className} src={spriteSrc(fileName)} alt="" aria-hidden="true" draggable={false} />;
}
