import type { DungeonMap, Position } from './types';

export function positionKey(position: Position): string {
  return `${position.x},${position.y}`;
}

export function samePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function inBounds(map: DungeonMap, position: Position): boolean {
  return position.x >= 0 && position.y >= 0 && position.x < map.width && position.y < map.height;
}

export function isWalkable(map: DungeonMap, position: Position): boolean {
  return inBounds(map, position) && map.tiles[position.y][position.x].kind !== 'wall';
}

export function neighbors(map: DungeonMap, position: Position): Position[] {
  return [
    { x: position.x, y: position.y - 1 },
    { x: position.x + 1, y: position.y },
    { x: position.x, y: position.y + 1 },
    { x: position.x - 1, y: position.y },
  ].filter((next) => isWalkable(map, next));
}

export function floodFill(map: DungeonMap, start: Position): Set<string> {
  const reached = new Set<string>();
  const queue: Position[] = [start];
  reached.add(positionKey(start));

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of neighbors(map, current)) {
      const key = positionKey(next);
      if (!reached.has(key)) {
        reached.add(key);
        queue.push(next);
      }
    }
  }

  return reached;
}

export function findPath(
  map: DungeonMap,
  start: Position,
  goal: Position,
  blocked: Set<string> = new Set(),
): Position[] {
  const startKey = positionKey(start);
  const goalKey = positionKey(goal);
  const queue: Position[] = [start];
  const cameFrom = new Map<string, string | null>();
  cameFrom.set(startKey, null);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = positionKey(current);
    if (currentKey === goalKey) break;

    for (const next of neighbors(map, current)) {
      const key = positionKey(next);
      if (blocked.has(key) && key !== goalKey) continue;
      if (!cameFrom.has(key)) {
        cameFrom.set(key, currentKey);
        queue.push(next);
      }
    }
  }

  if (!cameFrom.has(goalKey)) return [];

  const path: Position[] = [];
  let currentKey: string | null = goalKey;
  while (currentKey && currentKey !== startKey) {
    const [x, y] = currentKey.split(',').map(Number);
    path.push({ x, y });
    currentKey = cameFrom.get(currentKey) ?? null;
  }

  return path.reverse();
}
