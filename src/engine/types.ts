// 不思議なダンジョンもどき 2.0 — ゲームの状態の型（DOM に依存しない）

/** 8方向。0=上、1=右上、2=右、3=右下、4=下、5=左下、6=左、7=左上 */
export type Dir = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const DX = [0, 1, 1, 1, 0, -1, -1, -1] as const;
export const DY = [-1, -1, 0, 1, 1, 1, 0, -1] as const;
export const DIRS: Dir[] = [0, 1, 2, 3, 4, 5, 6, 7];

export interface Pos { x: number; y: number }

/** 地形 */
export const T_WALL = 0;
export const T_FLOOR = 1;
export const T_WATER = 2;
export const T_LAVA = 3;
/** 壊せない外壁 */
export const T_HARD = 4;

export type ItemCat = 'weapon' | 'armor' | 'charm' | 'grass' | 'scroll' | 'staff' | 'pot' | 'food' | 'arrow' | 'gold';

export interface Item {
  uid: number;
  id: string;
  /** 強化値（武器・防具） */
  plus?: number;
  /** 合成で付いた印（武器・防具） */
  seals?: string[];
  cursed?: boolean;
  /** 杖の残り回数 */
  charges?: number;
  /** 矢の本数・お金の額 */
  count?: number;
  /** 壺の中身と容量 */
  contents?: Item[];
  cap?: number;
  /** この品の強化値・回数・呪いが分かっているか */
  known?: boolean;
  /** 店の品（まだ買っていない） */
  shop?: boolean;
}

export interface FloorItem { item: Item; x: number; y: number }

export interface Trap { x: number; y: number; id: string; found: boolean }

export interface Status {
  sleep?: number;
  confuse?: number;
  /** 金縛り。999 は「叩かれるまで」 */
  paralyze?: number;
  slow?: number;
  fast?: number;
  blind?: number;
  /** トラバサミ */
  stuck?: number;
  /** 無敵 */
  invincible?: number;
  /** 特技を封じられた */
  sealed?: boolean;
  /** 痛み分け（プレイヤーの受けた痛みを受ける） */
  bond?: boolean;
  /** 攻撃力が下がった（毒草を当てられた） */
  weak?: boolean;
}

export interface Monster {
  uid: number;
  id: string;
  x: number;
  y: number;
  dir: Dir;
  hp: number;
  maxHp: number;
  awake: boolean;
  st: Status;
  /** 仲間 */
  ally?: boolean;
  /** 仲間の強さの上乗せ（敵を倒すたびに上がる） */
  bonus?: number;
  /** 盗んだ道具・お金 */
  stolen?: Item[];
  stolenGold?: number;
  /** 盗んだあと逃げている */
  fleeing?: boolean;
  role?: 'keeper' | 'guard' | 'boss';
  /** 店主が怒っている */
  angry?: boolean;
  /** 最後にプレイヤーを見た場所 */
  goal?: Pos | null;
  /** うろつく目的地 */
  wander?: Pos | null;
  /** 深層での強さの倍率 */
  scale?: number;
  /** 爆発済み・倒れた */
  dead?: boolean;
  /** 召喚の間隔（ボス） */
  cd?: number;
}

export interface Player {
  x: number;
  y: number;
  dir: Dir;
  hp: number;
  maxHp: number;
  lv: number;
  exp: number;
  str: number;
  maxStr: number;
  hunger: number;
  maxHunger: number;
  gold: number;
  inv: Item[];
  eq: { weapon?: number; armor?: number; charm?: number; arrow?: number };
  st: Status;
  /** HP 回復の端数 */
  regen: number;
  /** 満腹度の端数 */
  hungerAcc: number;
}

export type RoomKind = 'normal' | 'shop' | 'house' | 'boss';

export interface Room { id: number; x: number; y: number; w: number; h: number; kind: RoomKind; lit: boolean }

export interface Shop { room: number; keeper: number }

export type FloorKind = 'normal' | 'big' | 'boss';

export interface Floor {
  no: number;
  w: number;
  h: number;
  tiles: number[];
  /** 各マスの部屋の番号（通路は -1） */
  roomOf: number[];
  rooms: Room[];
  stairs: Pos | null;
  items: FloorItem[];
  traps: Trap[];
  /** 一度見たマス（ミニマップ用） */
  seen: number[];
  /** 聖域の巻物が置かれたマスは items で判断する */
  dark: boolean;
  fog: boolean;
  kind: FloorKind;
  shop: Shop | null;
  /** モンスターハウスの部屋（まだ起きていなければ番号） */
  house: number;
  houseAwake: boolean;
  /** この階に来てからのターン */
  turns: number;
  /** 帯（見た目と曲） */
  band: number;
  /** 千里眼・地図を使った */
  clairvoyant?: boolean;
  mapped?: boolean;
}

export type RunMode = 'main' | 'deep' | 'daily' | 'practice';

export interface LogLine { t: string; c?: 'good' | 'bad' | 'info' | 'item' | 'warn' }

/** 画面に問い合わせる（店の支払い・売却） */
export type Prompt =
  | { kind: 'pay'; amount: number; dir: Dir }
  | { kind: 'sell'; amount: number; itemUid: number };

export interface RunStats {
  kills: number;
  turns: number;
  maxFloor: number;
  itemsUsed: number;
  synth: number;
  stolen: number;
  allies: number;
  killedIds: Record<string, number>;
  seenIds: Record<string, true>;
}

export interface RunEnd {
  kind: 'dead' | 'clear' | 'return' | 'quit';
  cause: string;
  floor: number;
}

export interface Run {
  v: number;
  mode: RunMode;
  seed: number;
  /** 行動の乱数（地図は seed と階から作る） */
  rng: number;
  turn: number;
  floorNo: number;
  lastFloor: number;
  player: Player;
  floor: Floor;
  monsters: Monster[];
  nextUid: number;
  log: LogLine[];
  /** 種類として正体が分かったもの */
  known: Record<string, true>;
  /** 遊ぶたびに変わる仮の名前 */
  fake: Record<string, string>;
  /** プレイヤーが付けた名前 */
  named: Record<string, string>;
  stats: RunStats;
  end: RunEnd | null;
  /** 店の品を持ち逃げした */
  thief: boolean;
  spawnIn: number;
  prompt: Prompt | null;
  dailyDate?: string;
  /** ボスを倒した */
  bossDown?: boolean;
  /** 倍速のプレイヤーの、ターンの前半か */
  half?: number;
  /** 時止めの残り */
  timeStop?: number;
  /** 練習迷宮の案内を出した階 */
  tutorial?: number;
  /** 落とし穴に落ちた（手番の終わりに次の階へ） */
  pendingFall?: boolean;
}

/** 描画用の出来事。player の uid は 0 */
export type GameEvent =
  | { k: 'move'; uid: number; fx: number; fy: number; tx: number; ty: number }
  | { k: 'atk'; uid: number; dir: Dir }
  | { k: 'hit'; uid: number; x: number; y: number; n: number; crit?: boolean }
  | { k: 'heal'; x: number; y: number; n: number }
  | { k: 'miss'; x: number; y: number }
  | { k: 'die'; uid: number; x: number; y: number }
  | { k: 'proj'; fx: number; fy: number; tx: number; ty: number; sprite: string }
  | { k: 'beam'; fx: number; fy: number; tx: number; ty: number; color: string }
  | { k: 'boom'; x: number; y: number; r: number }
  | { k: 'warp'; uid: number; x: number; y: number }
  | { k: 'flash'; color: string }
  | { k: 'lvup' }
  | { k: 'se'; name: string }
  | { k: 'floor' }
  | { k: 'popup'; x: number; y: number; text: string; color: string };

export type Verb = 'use' | 'equip' | 'unequip' | 'throw' | 'drop' | 'put' | 'take' | 'name';

export type Action =
  | { t: 'move'; dir: Dir }
  | { t: 'dash'; dir: Dir }
  | { t: 'face'; dir: Dir }
  | { t: 'attack' }
  | { t: 'wait' }
  | { t: 'rest' }
  | { t: 'pickup' }
  | { t: 'stairs' }
  | { t: 'shoot' }
  | { t: 'swapFoot'; uid: number }
  | { t: 'item'; uid: number; verb: Verb; target?: number; name?: string; scroll?: string }
  | { t: 'answer'; yes: boolean; steal?: boolean };
