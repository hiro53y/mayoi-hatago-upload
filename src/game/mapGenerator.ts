import { MAP_HEIGHT, MAP_WIDTH, VIEW_RADIUS } from './constants';
import { createRng } from './rng';
import { floodFill, manhattan, positionKey } from './pathfinding';
import type { DungeonMap, Position, Room, Tile } from './types';

function makeWallTile(): Tile {
  return { kind: 'wall', explored: false, visible: false };
}

function makeFloorTile(): Tile {
  return { kind: 'floor', explored: false, visible: false };
}

function roomCenter(room: Room): Position {
  return {
    x: Math.floor(room.x + room.width / 2),
    y: Math.floor(room.y + room.height / 2),
  };
}

function overlaps(a: Room, b: Room): boolean {
  return (
    a.x - 1 < b.x + b.width &&
    a.x + a.width + 1 > b.x &&
    a.y - 1 < b.y + b.height &&
    a.y + a.height + 1 > b.y
  );
}

function carveRoom(tiles: Tile[][], room: Room): void {
  for (let y = room.y; y < room.y + room.height; y += 1) {
    for (let x = room.x; x < room.x + room.width; x += 1) {
      tiles[y][x] = makeFloorTile();
    }
  }
}

function carveCorridor(tiles: Tile[][], from: Position, to: Position): void {
  let x = from.x;
  let y = from.y;
  while (x !== to.x) {
    tiles[y][x] = makeFloorTile();
    x += x < to.x ? 1 : -1;
  }
  while (y !== to.y) {
    tiles[y][x] = makeFloorTile();
    y += y < to.y ? 1 : -1;
  }
  tiles[y][x] = makeFloorTile();
}

function allFloorPositions(map: DungeonMap): Position[] {
  const positions: Position[] = [];
  for (let y = 1; y < map.height - 1; y += 1) {
    for (let x = 1; x < map.width - 1; x += 1) {
      if (map.tiles[y][x].kind !== 'wall') positions.push({ x, y });
    }
  }
  return positions;
}

function buildMap(seed: number, attempt: number): DungeonMap {
  const rng = createRng(seed + attempt * 7919);
  const tiles = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => makeWallTile()),
  );
  const rooms: Room[] = [];
  const targetRooms = rng.int(7, 10);

  for (let tries = 0; tries < 90 && rooms.length < targetRooms; tries += 1) {
    const width = rng.int(4, 7);
    const height = rng.int(4, 7);
    const room: Room = {
      x: rng.int(1, MAP_WIDTH - width - 2),
      y: rng.int(1, MAP_HEIGHT - height - 2),
      width,
      height,
    };
    if (rooms.every((existing) => !overlaps(room, existing))) {
      rooms.push(room);
      carveRoom(tiles, room);
    }
  }

  rooms.sort((a, b) => roomCenter(a).x - roomCenter(b).x);
  for (let i = 1; i < rooms.length; i += 1) {
    const previous = roomCenter(rooms[i - 1]);
    const current = roomCenter(rooms[i]);
    if (rng.chance(0.5)) {
      carveCorridor(tiles, previous, { x: current.x, y: previous.y });
      carveCorridor(tiles, { x: current.x, y: previous.y }, current);
    } else {
      carveCorridor(tiles, previous, { x: previous.x, y: current.y });
      carveCorridor(tiles, { x: previous.x, y: current.y }, current);
    }
  }

  const playerStart = roomCenter(rooms[0]);
  const map: DungeonMap = {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tiles,
    rooms,
    stairs: playerStart,
    playerStart,
  };
  const reached = floodFill(map, playerStart);
  const floors = allFloorPositions(map).filter((position) => reached.has(positionKey(position)));
  const stairs = floors.reduce((best, position) =>
    manhattan(position, playerStart) > manhattan(best, playerStart) ? position : best,
  );
  map.stairs = stairs;
  map.tiles[stairs.y][stairs.x] = { ...map.tiles[stairs.y][stairs.x], kind: 'stairs' };
  return map;
}

export function generateDungeonMap(seed: number): DungeonMap {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const map = buildMap(seed, attempt);
    const reached = floodFill(map, map.playerStart);
    if (
      map.rooms.length >= 6 &&
      reached.has(positionKey(map.stairs)) &&
      manhattan(map.playerStart, map.stairs) >= 10
    ) {
      return updateVisibility(map, map.playerStart, VIEW_RADIUS);
    }
  }

  const fallback = buildMap(seed, 99);
  return updateVisibility(fallback, fallback.playerStart, VIEW_RADIUS);
}

function hasLineOfSight(map: DungeonMap, from: Position, to: Position): boolean {
  let x0 = from.x;
  let y0 = from.y;
  const x1 = to.x;
  const y1 = to.y;
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (!(x0 === x1 && y0 === y1)) {
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
    if (x0 === x1 && y0 === y1) return true;
    if (map.tiles[y0]?.[x0]?.kind === 'wall') return false;
  }

  return true;
}

export function updateVisibility(map: DungeonMap, playerPosition: Position, radius: number): DungeonMap {
  const tiles = map.tiles.map((row) =>
    row.map((tile) => ({
      ...tile,
      visible: false,
    })),
  );

  const nextMap: DungeonMap = { ...map, tiles };
  for (let y = Math.max(0, playerPosition.y - radius); y <= Math.min(map.height - 1, playerPosition.y + radius); y += 1) {
    for (let x = Math.max(0, playerPosition.x - radius); x <= Math.min(map.width - 1, playerPosition.x + radius); x += 1) {
      const position = { x, y };
      if (manhattan(playerPosition, position) <= radius && hasLineOfSight(map, playerPosition, position)) {
        tiles[y][x].visible = true;
        tiles[y][x].explored = true;
      }
    }
  }

  return nextMap;
}
