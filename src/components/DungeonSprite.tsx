import type { ItemCategory, TrapType } from '../game/types';

interface Props {
  kind: 'player' | 'enemy' | 'item' | 'stairs' | 'trap';
  enemyKind?: string;
  itemCategory?: ItemCategory;
  trapType?: TrapType;
}

type Pixel = readonly [x: number, y: number, width: number, height: number, color: string];

function Pixels({ data }: { data: readonly Pixel[] }) {
  return (
    <>
      {data.map(([x, y, width, height, color], index) => (
        <rect key={`${x}-${y}-${width}-${height}-${index}`} x={x} y={y} width={width} height={height} fill={color} />
      ))}
    </>
  );
}

function PixelSvg({ className, data }: { className: string; data: readonly Pixel[] }) {
  return (
    <svg className={`game-sprite ${className}`} viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true">
      <rect x="9" y="28" width="14" height="2" fill="rgba(0,0,0,.34)" />
      <Pixels data={data} />
    </svg>
  );
}

const PLAYER: Pixel[] = [
  [12, 2, 8, 2, '#5a351b'],
  [9, 4, 14, 2, '#b8792a'],
  [6, 6, 20, 2, '#f0c85b'],
  [8, 8, 16, 2, '#9a5c21'],
  [11, 9, 10, 2, '#2a1b15'],
  [12, 11, 8, 5, '#e7b57a'],
  [13, 13, 2, 1, '#15100e'],
  [18, 13, 2, 1, '#15100e'],
  [15, 15, 4, 1, '#7c3322'],
  [9, 16, 14, 2, '#3a1d17'],
  [10, 18, 12, 7, '#274c7d'],
  [13, 18, 2, 7, '#f3e4cc'],
  [18, 18, 2, 7, '#f3e4cc'],
  [8, 18, 2, 6, '#e7b57a'],
  [22, 17, 2, 7, '#e7b57a'],
  [11, 25, 4, 3, '#101c32'],
  [18, 25, 4, 3, '#101c32'],
  [23, 11, 2, 11, '#dfe8ec'],
  [25, 9, 1, 10, '#f8f9f4'],
  [22, 21, 4, 2, '#77502b'],
];

const TANUKI: Pixel[] = [
  [9, 6, 4, 4, '#4c2418'],
  [19, 6, 4, 4, '#4c2418'],
  [7, 9, 18, 3, '#7d3f2e'],
  [6, 12, 20, 11, '#9a513a'],
  [8, 23, 16, 4, '#5d2a22'],
  [10, 14, 4, 2, '#f1c76d'],
  [18, 14, 4, 2, '#f1c76d'],
  [11, 15, 2, 2, '#14100f'],
  [19, 15, 2, 2, '#14100f'],
  [14, 19, 4, 1, '#2b1712'],
  [23, 21, 5, 3, '#6d3327'],
  [26, 18, 2, 4, '#6d3327'],
];

const KITSUNE: Pixel[] = [
  [7, 3, 5, 8, '#d98a3d'],
  [20, 3, 5, 8, '#d98a3d'],
  [9, 9, 14, 4, '#f0b45b'],
  [7, 13, 18, 10, '#c96d35'],
  [10, 23, 12, 4, '#6a2e1f'],
  [11, 15, 3, 2, '#1d1110'],
  [19, 15, 3, 2, '#1d1110'],
  [13, 18, 7, 1, '#fff0bd'],
  [22, 19, 6, 4, '#d98a3d'],
  [25, 15, 3, 5, '#fff0bd'],
];

const ARMOR: Pixel[] = [
  [10, 4, 12, 3, '#272321'],
  [8, 7, 16, 3, '#56514b'],
  [7, 10, 18, 15, '#77716a'],
  [9, 13, 14, 2, '#2c2927'],
  [11, 13, 3, 2, '#f2cf69'],
  [18, 13, 3, 2, '#f2cf69'],
  [10, 18, 12, 2, '#b5bab8'],
  [8, 25, 6, 3, '#393634'],
  [18, 25, 6, 3, '#393634'],
  [24, 7, 2, 13, '#c8d1d1'],
  [26, 5, 2, 7, '#eef4f0'],
];

const ONIBI: Pixel[] = [
  [15, 2, 3, 5, '#f6d86a'],
  [12, 6, 9, 6, '#f29a3a'],
  [10, 11, 13, 11, '#d95535'],
  [8, 17, 17, 8, '#7f2630'],
  [12, 15, 8, 8, '#f5d66b'],
  [14, 19, 4, 4, '#fff0a5'],
  [12, 17, 2, 2, '#35151a'],
  [19, 17, 2, 2, '#35151a'],
];

const KAPPA: Pixel[] = [
  [10, 6, 12, 3, '#e4c063'],
  [8, 9, 16, 4, '#3a5e31'],
  [7, 13, 18, 11, '#71995a'],
  [10, 24, 12, 4, '#314d2d'],
  [10, 15, 4, 2, '#f1da91'],
  [18, 15, 4, 2, '#f1da91'],
  [11, 16, 2, 2, '#10170f'],
  [19, 16, 2, 2, '#10170f'],
  [13, 21, 7, 2, '#263d23'],
  [5, 17, 3, 5, '#5d804a'],
  [24, 17, 3, 5, '#5d804a'],
];

const SHADOW: Pixel[] = [
  [12, 3, 8, 3, '#20182b'],
  [9, 6, 14, 4, '#332642'],
  [7, 10, 18, 14, '#44355a'],
  [9, 24, 14, 4, '#191320'],
  [11, 14, 3, 3, '#eee7ff'],
  [19, 14, 3, 3, '#eee7ff'],
  [13, 20, 7, 2, '#15101a'],
  [6, 18, 3, 7, '#2b2138'],
  [24, 18, 3, 7, '#2b2138'],
];

const RICE: Pixel[] = [
  [10, 10, 12, 3, '#7c4b2f'],
  [8, 13, 16, 8, '#f5eddd'],
  [10, 21, 12, 4, '#342720'],
  [12, 14, 2, 2, '#3d2b21'],
  [17, 13, 2, 2, '#3d2b21'],
];

const HERB: Pixel[] = [
  [15, 7, 3, 18, '#355b2c'],
  [9, 9, 7, 5, '#7fb24d'],
  [17, 8, 7, 6, '#9ccc61'],
  [8, 16, 8, 5, '#6f9c42'],
  [17, 16, 8, 5, '#82b752'],
  [12, 22, 9, 3, '#dfeec0'],
];

const ITEM_SWORD: Pixel[] = [
  [21, 5, 3, 11, '#f0f6f6'],
  [19, 8, 2, 12, '#9aa7ab'],
  [13, 18, 9, 3, '#d7a84b'],
  [10, 20, 4, 4, '#6b3f2b'],
  [7, 23, 5, 3, '#2d1d16'],
];

const ITEM_ARMOR: Pixel[] = [
  [9, 8, 14, 3, '#c4ccd0'],
  [8, 11, 16, 14, '#5d707c'],
  [11, 14, 10, 2, '#27363f'],
  [12, 19, 8, 2, '#b9c5c9'],
  [10, 25, 4, 2, '#27363f'],
  [18, 25, 4, 2, '#27363f'],
];

const BOLT: Pixel[] = [
  [14, 4, 5, 8, '#fff0a5'],
  [11, 12, 10, 4, '#f2c35b'],
  [16, 16, 6, 4, '#d65b35'],
  [13, 20, 5, 8, '#f2c35b'],
  [9, 14, 5, 4, '#fff0a5'],
];

const BELL: Pixel[] = [
  [14, 6, 4, 3, '#d7a84b'],
  [10, 9, 12, 12, '#5f7890'],
  [12, 11, 8, 7, '#efe4d2'],
  [14, 21, 4, 3, '#d7a84b'],
  [9, 24, 14, 2, '#1c303f'],
];

const STAIRS: Pixel[] = [
  [18, 6, 8, 4, '#c08a49'],
  [15, 10, 11, 4, '#8b5d32'],
  [12, 14, 14, 4, '#c08a49'],
  [9, 18, 17, 4, '#8b5d32'],
  [6, 22, 20, 4, '#c08a49'],
  [18, 8, 8, 1, '#f1d389'],
  [15, 12, 11, 1, '#f1d389'],
  [12, 16, 14, 1, '#f1d389'],
  [9, 20, 17, 1, '#f1d389'],
];

const TRAP_MUD: Pixel[] = [
  [8, 18, 16, 5, '#4f3a2c'],
  [10, 15, 12, 3, '#70543d'],
  [12, 12, 8, 3, '#2b2019'],
  [7, 23, 18, 2, '#201714'],
  [11, 17, 3, 2, '#9a7b55'],
  [19, 18, 3, 2, '#9a7b55'],
];

const TRAP_HUNGER: Pixel[] = [
  [9, 10, 14, 12, '#6d4c36'],
  [11, 8, 10, 3, '#d3a850'],
  [12, 13, 8, 2, '#231712'],
  [13, 17, 6, 2, '#231712'],
  [8, 22, 16, 3, '#2a1e18'],
];

const TRAP_BELL: Pixel[] = [
  [14, 5, 4, 4, '#f2c85d'],
  [11, 9, 10, 11, '#b48234'],
  [9, 20, 14, 3, '#684125'],
  [15, 22, 2, 4, '#f2c85d'],
  [7, 12, 2, 7, '#78a7b6'],
  [23, 12, 2, 7, '#78a7b6'],
];

export default function DungeonSprite({ kind, enemyKind, itemCategory, trapType }: Props) {
  if (kind === 'player') return <PixelSvg className="player-sprite pixel-sprite" data={PLAYER} />;
  if (kind === 'stairs') return <PixelSvg className="stairs-sprite pixel-sprite" data={STAIRS} />;
  if (kind === 'trap') return <PixelSvg className="trap-sprite pixel-sprite" data={trapPixels(trapType ?? 'slow-mud')} />;
  if (kind === 'item') return <PixelSvg className="item-sprite pixel-sprite" data={itemPixels(itemCategory ?? 'support')} />;
  return <PixelSvg className="enemy-sprite pixel-sprite" data={enemyPixels(enemyKind ?? 'mayoi-tanuki')} />;
}

function enemyPixels(enemyKind: string): Pixel[] {
  if (enemyKind === 'kusakage-kitsune') return KITSUNE;
  if (enemyKind === 'tsuchikure-musha' || enemyKind === 'sabi-yoroi') return ARMOR;
  if (enemyKind === 'akari-onibi') return ONIBI;
  if (enemyKind === 'harapeko-kappa') return KAPPA;
  if (enemyKind === 'kage-boshi') return SHADOW;
  return TANUKI;
}

function itemPixels(category: ItemCategory): Pixel[] {
  if (category === 'food') return RICE;
  if (category === 'healing') return HERB;
  if (category === 'weapon') return ITEM_SWORD;
  if (category === 'armor') return ITEM_ARMOR;
  if (category === 'offense') return BOLT;
  return BELL;
}

function trapPixels(type: TrapType): Pixel[] {
  if (type === 'hunger-floor') return TRAP_HUNGER;
  if (type === 'snare-bell') return TRAP_BELL;
  return TRAP_MUD;
}
