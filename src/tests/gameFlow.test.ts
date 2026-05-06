import { performPlayerAction } from '../game/actions';
import { createNewGame } from '../game/gameState';
import { neighbors } from '../game/pathfinding';
import type { Enemy, GameState, InventoryItem, Position } from '../game/types';
import { assert, equal } from './test-utils';

function commandToward(from: Position, to: Position) {
  return {
    type: 'move' as const,
    dx: to.x - from.x,
    dy: to.y - from.y,
  };
}

function firstOpenNeighbor(state: GameState): Position {
  const position = neighbors(state.map, state.player.position).find(
    (candidate) => !state.enemies.some((enemy) => enemy.position.x === candidate.x && enemy.position.y === candidate.y),
  );
  assert(position, 'expected an open neighboring tile');
  return position;
}

export function runGameFlowTests(): void {
  let state = createNewGame(4242);
  const start = { ...state.player.position };
  const destination = firstOpenNeighbor(state);
  state.enemies = [];
  const hungerBeforeMove = state.player.hunger;
  state = performPlayerAction(state, commandToward(start, destination));
  equal(state.player.position.x, destination.x, 'player should move on floor x');
  equal(state.player.position.y, destination.y, 'player should move on floor y');
  equal(state.player.hunger, hungerBeforeMove - 1, 'normal movement should cost exactly 1 hunger');

  let wallState = JSON.parse(JSON.stringify(state)) as GameState;
  wallState.player.position = { x: 0, y: 0 };
  wallState.enemies = [
    {
      id: 'wall-enemy-test',
      kindId: 'mayoi-tanuki',
      name: '迷い狸',
      hp: 10,
      maxHp: 10,
      attack: 8,
      defense: 0,
      exp: 1,
      score: 1,
      position: { x: 1, y: 0 },
      awakeRange: 10,
      moveEvery: 1,
    },
  ];
  const wallHunger = wallState.player.hunger;
  const wallHp = wallState.player.hp;
  const wallTurn = wallState.turn;
  let blocked = wallState;
  blocked = performPlayerAction(blocked, { type: 'move', dx: -1, dy: 0 });
  blocked = performPlayerAction(blocked, { type: 'move', dx: -1, dy: 0 });
  blocked = performPlayerAction(blocked, { type: 'move', dx: -1, dy: 0 });
  equal(blocked.player.position.x, 0, 'player should not move out of bounds');
  equal(blocked.player.hunger, wallHunger, 'wall collision should not cost hunger');
  equal(blocked.player.hp, wallHp, 'wall collision should not trigger enemy actions');
  equal(blocked.turn, wallTurn, 'wall collision should not advance turns');
  const wallLog = blocked.logs[blocked.logs.length - 1];
  equal(wallLog.text, '壁に行く手を阻まれた。', 'wall collision should log the blocked message');
  equal(wallLog.count ?? 1, 3, 'repeated wall collision logs should be collapsed');

  let itemState = createNewGame(5151);
  itemState.enemies = [];
  const itemTile = firstOpenNeighbor(itemState);
  itemState.groundItems = [{ id: 'test-ground', itemId: 'traveler-knife', position: itemTile }];
  itemState = performPlayerAction(itemState, commandToward(itemState.player.position, itemTile));
  const knife = itemState.player.inventory.find((item) => item.itemId === 'traveler-knife');
  assert(knife, 'player should pick up an item');
  const hungerBeforeEquip = itemState.player.hunger;
  itemState = performPlayerAction(itemState, { type: 'equipItem', instanceId: knife.instanceId });
  equal(itemState.player.equipment.weaponId, knife.instanceId, 'weapon should equip');
  equal(itemState.player.hunger, hungerBeforeEquip, 'equipment changes should not cost hunger');

  const food: InventoryItem = { instanceId: 'food-test', itemId: 'grilled-musubi' };
  itemState.player.inventory.push(food);
  itemState.player.hunger = 10;
  itemState = performPlayerAction(itemState, { type: 'useItem', instanceId: food.instanceId });
  assert(itemState.player.hunger > 10, 'food should restore hunger');

  let stairState = createNewGame(6161);
  stairState.enemies = [];
  stairState.player.position = stairState.map.stairs;
  const hungerBeforeDescend = stairState.player.hunger;
  stairState = performPlayerAction(stairState, { type: 'descend' });
  equal(stairState.floor, 2, 'stairs should move to next floor');
  equal(stairState.player.hunger, hungerBeforeDescend - 1, 'descending should cost exactly 1 hunger');

  let clearState = createNewGame(7171);
  clearState.enemies = [];
  clearState.floor = 9;
  clearState.player.position = clearState.map.stairs;
  clearState = performPlayerAction(clearState, { type: 'descend' });
  equal(clearState.status, 'won', 'descending from floor 9 should clear');
  equal(clearState.result?.outcome, 'clear', 'clear result should be recorded');

  let attackState = createNewGame(8181);
  attackState.enemies = [];
  const enemyPosition = firstOpenNeighbor(attackState);
  const enemy: Enemy = {
    id: 'enemy-test',
    kindId: 'mayoi-tanuki',
    name: '迷い狸',
    hp: 1,
    maxHp: 1,
    attack: 0,
    defense: 0,
    exp: 1,
    score: 1,
    position: enemyPosition,
    awakeRange: 1,
    moveEvery: 1,
  };
  attackState.enemies = [enemy];
  const attackCommand = commandToward(attackState.player.position, enemyPosition);
  const hungerBeforeAttack = attackState.player.hunger;
  for (let i = 0; i < 10 && attackState.enemies.length > 0; i += 1) {
    attackState = performPlayerAction(attackState, attackCommand);
  }
  equal(attackState.enemies.length, 0, 'contact attack should defeat adjacent enemy');
  equal(attackState.player.hunger, hungerBeforeAttack - 1, 'contact attack should cost exactly 1 hunger');
  assert(
    attackState.visualEvents?.some((event) => event.kind === 'playerAttack' && event.hit),
    'contact attack should emit a visible hit event',
  );

  let waitState = createNewGame(9191);
  waitState.enemies = [];
  const hungerBeforeWait = waitState.player.hunger;
  waitState = performPlayerAction(waitState, { type: 'wait' });
  equal(waitState.player.hunger, hungerBeforeWait - 1, 'waiting should cost exactly 1 hunger');
}
