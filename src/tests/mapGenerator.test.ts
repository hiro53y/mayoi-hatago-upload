import { generateDungeonMap } from '../game/mapGenerator';
import { floodFill, positionKey } from '../game/pathfinding';
import { MAP_HEIGHT, MAP_WIDTH } from '../game/constants';
import { assert, equal, greaterThanOrEqual } from './test-utils';

export function runMapGeneratorTests(): void {
  const map = generateDungeonMap(12345);
  const reached = floodFill(map, map.playerStart);

  equal(map.width, MAP_WIDTH, 'map width should be 24');
  equal(map.height, MAP_HEIGHT, 'map height should be 24');
  assert(map.tiles[map.playerStart.y][map.playerStart.x].kind !== 'wall', 'player start should be walkable');
  equal(map.tiles[map.stairs.y][map.stairs.x].kind, 'stairs', 'stairs tile should exist');
  assert(reached.has(positionKey(map.stairs)), 'stairs should be reachable');
  greaterThanOrEqual(map.rooms.length, 6, 'map should contain enough rooms');
}
