export type TileKind = 'wall' | 'floor' | 'stairs';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type StatusEffectType = 'poison' | 'blind' | 'slow' | 'swift' | 'vision';

export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  kind: TileKind;
  explored: boolean;
  visible: boolean;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DungeonMap {
  width: number;
  height: number;
  tiles: Tile[][];
  rooms: Room[];
  stairs: Position;
  playerStart: Position;
}

export interface StatusEffect {
  type: StatusEffectType;
  turns: number;
  potency?: number;
}

export interface InventoryItem {
  instanceId: string;
  itemId: string;
}

export interface EquipmentSlots {
  weaponId: string | null;
  armorId: string | null;
}

export interface Player {
  position: Position;
  facing: Direction;
  hp: number;
  maxHp: number;
  baseAttack: number;
  baseDefense: number;
  level: number;
  exp: number;
  hunger: number;
  maxHunger: number;
  score: number;
  inventory: InventoryItem[];
  equipment: EquipmentSlots;
  statusEffects: StatusEffect[];
}

export interface EnemyDefinition {
  id: string;
  name: string;
  minFloor: number;
  hp: number;
  attack: number;
  defense: number;
  exp: number;
  score: number;
  awakeRange: number;
  moveEvery?: number;
  special?: 'hunger' | 'blind' | 'poison';
}

export interface Enemy {
  id: string;
  kindId: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  exp: number;
  score: number;
  position: Position;
  awakeRange: number;
  moveEvery: number;
  special?: EnemyDefinition['special'];
}

export type ItemCategory = 'healing' | 'food' | 'offense' | 'support' | 'weapon' | 'armor';

export type EquipmentSlot = 'weapon' | 'armor';

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  power?: number;
  attackBonus?: number;
  defenseBonus?: number;
  hitModifier?: number;
  statusResist?: number;
  slot?: EquipmentSlot;
  rarity: number;
  minFloor: number;
}

export interface GroundItem {
  id: string;
  itemId: string;
  position: Position;
}

export interface LogEntry {
  id: number;
  turn: number;
  text: string;
  tone?: 'normal' | 'good' | 'warn' | 'bad';
}

export interface VisualEvent {
  id: number;
  kind: 'playerAttack' | 'enemyAttack';
  source: Position;
  target: Position;
  direction: Direction;
  hit: boolean;
}

export interface RunStats {
  kills: number;
  itemsUsed: number;
  turns: number;
  deepestFloor: number;
  startedAt: string;
  endedAt?: string;
  deathCause?: string;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameResult {
  outcome: 'clear' | 'gameover';
  floor: number;
  level: number;
  kills: number;
  score: number;
  turns: number;
  cause: string;
  itemsUsed: number;
}

export interface GameState {
  version: number;
  runId: string;
  seed: number;
  rngState: number;
  floor: number;
  turn: number;
  status: GameStatus;
  map: DungeonMap;
  player: Player;
  enemies: Enemy[];
  groundItems: GroundItem[];
  logs: LogEntry[];
  visualEvents?: VisualEvent[];
  runStats: RunStats;
  result: GameResult | null;
}

export interface Records {
  version: number;
  bestFloor: number;
  clearCount: number;
  totalRuns: number;
  totalKills: number;
  bestScore: number;
  discoveredItems: string[];
  discoveredEnemies: string[];
  totalTurns: number;
  lastResult: GameResult | null;
}
