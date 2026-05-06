import { INVENTORY_LIMIT } from './constants';
import { createRng, randomId, type Rng } from './rng';
import { manhattan, positionKey } from './pathfinding';
import type { DungeonMap, GroundItem, InventoryItem, ItemDefinition, Position } from './types';

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  {
    id: 'small-herb',
    name: '小さな薬草',
    category: 'healing',
    description: 'HPを15回復する。',
    power: 15,
    rarity: 12,
    minFloor: 1,
  },
  {
    id: 'large-herb',
    name: '大きな薬草',
    category: 'healing',
    description: 'HPを35回復する。',
    power: 35,
    rarity: 6,
    minFloor: 2,
  },
  {
    id: 'life-pill',
    name: '命の丸薬',
    category: 'healing',
    description: '最大HPを4増やし、HPも少し回復する。',
    power: 4,
    rarity: 2,
    minFloor: 3,
  },
  {
    id: 'grilled-musubi',
    name: '焼きむすび',
    category: 'food',
    description: '満腹度を50回復する。',
    power: 50,
    rarity: 9,
    minFloor: 1,
  },
  {
    id: 'dried-mochi',
    name: '干し餅',
    category: 'food',
    description: '満腹度を25回復する。',
    power: 25,
    rarity: 10,
    minFloor: 1,
  },
  {
    id: 'sansai-wrap',
    name: '山菜包み',
    category: 'food',
    description: '満腹度を80回復する。',
    power: 80,
    rarity: 4,
    minFloor: 4,
  },
  {
    id: 'flint',
    name: '火打ち石',
    category: 'offense',
    description: '向いている直線上の最初の敵に14ダメージ。',
    power: 14,
    rarity: 7,
    minFloor: 1,
  },
  {
    id: 'thunder-tag',
    name: '雷鳴の札',
    category: 'offense',
    description: '周囲2マスの敵に12ダメージ。',
    power: 12,
    rarity: 5,
    minFloor: 3,
  },
  {
    id: 'wind-tag',
    name: '風切り札',
    category: 'offense',
    description: '前方3マスにいる敵へ10ダメージ。',
    power: 10,
    rarity: 5,
    minFloor: 2,
  },
  {
    id: 'wake-bell',
    name: '目覚めの鈴',
    category: 'support',
    description: '毒、鈍足、目くらましを回復する。',
    rarity: 5,
    minFloor: 2,
  },
  {
    id: 'swift-grass',
    name: '逃げ足の草',
    category: 'support',
    description: '6ターン、敵の行動を少し遅らせる。',
    power: 6,
    rarity: 4,
    minFloor: 4,
  },
  {
    id: 'see-incense',
    name: '透き見の香',
    category: 'support',
    description: '10ターン、視界を広げる。',
    power: 10,
    rarity: 4,
    minFloor: 3,
  },
  {
    id: 'traveler-knife',
    name: '旅人の短刀',
    category: 'weapon',
    description: '攻撃力+2。',
    attackBonus: 2,
    hitModifier: 0,
    slot: 'weapon',
    rarity: 8,
    minFloor: 1,
  },
  {
    id: 'yamamori-sword',
    name: '山守の太刀',
    category: 'weapon',
    description: '攻撃力+4。',
    attackBonus: 4,
    hitModifier: 0.02,
    slot: 'weapon',
    rarity: 5,
    minFloor: 3,
  },
  {
    id: 'old-spear',
    name: '古びた槍',
    category: 'weapon',
    description: '攻撃力+6、命中率が少し下がる。',
    attackBonus: 6,
    hitModifier: -0.08,
    slot: 'weapon',
    rarity: 3,
    minFloor: 5,
  },
  {
    id: 'bamboo-hat',
    name: '竹編みの笠',
    category: 'armor',
    description: '防御力+1。',
    defenseBonus: 1,
    slot: 'armor',
    rarity: 8,
    minFloor: 1,
  },
  {
    id: 'iron-umbrella',
    name: '鉄張りの傘',
    category: 'armor',
    description: '防御力+3。',
    defenseBonus: 3,
    slot: 'armor',
    rarity: 5,
    minFloor: 3,
  },
  {
    id: 'guardian-haori',
    name: '守り鈴の羽織',
    category: 'armor',
    description: '防御力+2、状態異常に少し強くなる。',
    defenseBonus: 2,
    statusResist: 0.2,
    slot: 'armor',
    rarity: 3,
    minFloor: 5,
  },
];

export function getItemDefinition(itemId: string): ItemDefinition {
  const definition = ITEM_DEFINITIONS.find((item) => item.id === itemId);
  if (!definition) throw new Error(`Unknown item: ${itemId}`);
  return definition;
}

export function getItemLabel(item: InventoryItem): string {
  return getItemDefinition(item.itemId).name;
}

export function isInventoryFull(inventory: InventoryItem[]): boolean {
  return inventory.length >= INVENTORY_LIMIT;
}

function chooseItemDefinition(floor: number, rng: Rng): ItemDefinition {
  const candidates = ITEM_DEFINITIONS.filter((item) => item.minFloor <= floor);
  const total = candidates.reduce((sum, item) => sum + item.rarity, 0);
  let roll = rng.next() * total;
  for (const item of candidates) {
    roll -= item.rarity;
    if (roll <= 0) return item;
  }
  return candidates[candidates.length - 1];
}

export function createInventoryItem(itemId: string, rng: Rng): InventoryItem {
  return {
    instanceId: randomId('item', rng),
    itemId,
  };
}

export function createGroundItems(
  map: DungeonMap,
  floor: number,
  count: number,
  avoidPositions: Position[],
  rngState: number,
): { items: GroundItem[]; rngState: number } {
  const rng = createRng(rngState);
  const avoid = new Set(avoidPositions.map(positionKey));
  const occupied = new Set<string>();
  const candidates: Position[] = [];

  for (let y = 1; y < map.height - 1; y += 1) {
    for (let x = 1; x < map.width - 1; x += 1) {
      const position = { x, y };
      if (
        map.tiles[y][x].kind !== 'wall' &&
        !avoid.has(positionKey(position)) &&
        avoidPositions.every((avoidPosition) => manhattan(avoidPosition, position) >= 5)
      ) {
        candidates.push(position);
      }
    }
  }

  const items: GroundItem[] = [];
  while (items.length < count && candidates.length > 0) {
    const index = rng.int(0, candidates.length - 1);
    const [position] = candidates.splice(index, 1);
    const key = positionKey(position);
    if (occupied.has(key)) continue;
    occupied.add(key);
    items.push({
      id: randomId('ground', rng),
      itemId: chooseItemDefinition(floor, rng).id,
      position,
    });
  }

  return { items, rngState: rng.state };
}
