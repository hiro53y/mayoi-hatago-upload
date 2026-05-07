import { manhattan, positionKey } from './pathfinding';
import { randomId, type Rng } from './rng';
import type {
  DungeonMap,
  FloorTheme,
  FloorThemeId,
  GameState,
  MiniObjective,
  MiniObjectiveType,
  Position,
  Trap,
  TrapType,
} from './types';

const FLOOR_THEMES: FloorTheme[] = [
  { id: 'standard', name: '古道の間', description: '足音が乾いた土に沈む、標準的な階層。' },
  { id: 'overgrown', name: '苔むす庭', description: '草陰が多く、敵が近づくまで見落としやすい。' },
  { id: 'damp', name: '水音の廊', description: '水音で気配が紛れ、腹を減らす罠が混じる。' },
  { id: 'ember', name: '燠火の座敷', description: '赤い灯りがゆらめき、攻め時を見誤りやすい。' },
  { id: 'rust', name: '錆蔵', description: '硬い敵が増え、装備判断が重くなる。' },
  { id: 'shadow', name: '影灯籠の間', description: '見通しが悪く、目くらましの気配が濃い。' },
];

const TRAP_NAMES: Record<TrapType, string> = {
  'slow-mud': '絡み泥',
  'hunger-floor': '腹減らし床',
  'snare-bell': '呼び鈴床',
};

const TRAP_DESCRIPTIONS: Record<TrapType, string> = {
  'slow-mud': '足を取られ、しばらく鈍足になる。',
  'hunger-floor': '床下の冷気で満腹度が大きく減る。',
  'snare-bell': '鈴が鳴り、敵がこちらに気づきやすくなる。',
};

export function themeForFloor(floor: number, rng: Rng): FloorTheme {
  if (floor <= 1) return FLOOR_THEMES[0];
  if (floor >= 8) return FLOOR_THEMES.find((theme) => theme.id === 'shadow')!;
  if (floor >= 7) return FLOOR_THEMES.find((theme) => theme.id === 'rust')!;
  const pool = FLOOR_THEMES.filter((theme) => theme.id !== 'shadow' && theme.id !== 'rust');
  return rng.pick(pool);
}

export function getTrapName(type: TrapType): string {
  return TRAP_NAMES[type];
}

export function getTrapDescription(type: TrapType): string {
  return TRAP_DESCRIPTIONS[type];
}

export function floorThemeClass(themeId: FloorThemeId | undefined): string {
  return themeId ? `floor-theme-${themeId}` : 'floor-theme-standard';
}

function trapCountForFloor(floor: number, rng: Rng): number {
  if (floor <= 1) return 0;
  const base = floor <= 4 ? 1 : 2;
  return Math.min(3, base + (rng.chance(0.45) ? 1 : 0));
}

function chooseTrapType(floor: number, rng: Rng): TrapType {
  const candidates: TrapType[] = ['slow-mud'];
  if (floor >= 3) candidates.push('hunger-floor');
  if (floor >= 5) candidates.push('snare-bell');
  return rng.pick(candidates);
}

export function createTrapsForFloor(
  map: DungeonMap,
  floor: number,
  avoidPositions: Position[],
  rng: Rng,
): Trap[] {
  const avoid = new Set(avoidPositions.map(positionKey));
  const candidates: Position[] = [];

  for (let y = 1; y < map.height - 1; y += 1) {
    for (let x = 1; x < map.width - 1; x += 1) {
      const position = { x, y };
      if (
        map.tiles[y][x].kind === 'floor' &&
        !avoid.has(positionKey(position)) &&
        avoidPositions.every((avoidPosition) => manhattan(avoidPosition, position) >= 3)
      ) {
        candidates.push(position);
      }
    }
  }

  const traps: Trap[] = [];
  const occupied = new Set<string>();
  const count = trapCountForFloor(floor, rng);
  while (traps.length < count && candidates.length > 0) {
    const index = rng.int(0, candidates.length - 1);
    const [position] = candidates.splice(index, 1);
    const key = positionKey(position);
    if (occupied.has(key)) continue;
    occupied.add(key);
    traps.push({
      id: randomId('trap', rng),
      type: chooseTrapType(floor, rng),
      position,
      revealed: false,
    });
  }

  return traps;
}

export function createMiniObjective(floor: number): MiniObjective {
  const typeByFloor: MiniObjectiveType[] = ['defeat', 'collect', 'reachStairs'];
  const type = typeByFloor[(floor - 1) % typeByFloor.length];
  const rewardScore = 120 + floor * 35;
  if (type === 'defeat') {
    const target = floor >= 7 ? 3 : 2;
    return {
      id: `objective-${floor}-defeat`,
      type,
      description: `敵を${target}体倒す`,
      progress: 0,
      target,
      rewardScore,
      completed: false,
    };
  }
  if (type === 'collect') {
    return {
      id: `objective-${floor}-collect`,
      type,
      description: '道具を2個拾う',
      progress: 0,
      target: 2,
      rewardScore,
      completed: false,
    };
  }
  return {
    id: `objective-${floor}-stairs`,
    type,
    description: '階段を見つける',
    progress: 0,
    target: 1,
    rewardScore,
    completed: false,
  };
}

export function progressMiniObjective(
  state: GameState,
  type: MiniObjectiveType,
  amount = 1,
): { state: GameState; completed: boolean } {
  const objective = state.miniObjective;
  if (!objective || objective.completed || objective.type !== type) {
    return { state, completed: false };
  }

  const progress = Math.min(objective.target, objective.progress + amount);
  const completed = progress >= objective.target;
  return {
    state: {
      ...state,
      miniObjective: {
        ...objective,
        progress,
        completed,
      },
      player: completed
        ? {
            ...state.player,
            score: state.player.score + objective.rewardScore,
          }
        : state.player,
    },
    completed,
  };
}
