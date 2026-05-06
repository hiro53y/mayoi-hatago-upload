import { runEnemyPhase } from '../game/enemyAI';
import { createNewGame } from '../game/gameState';
import { createRng } from '../game/rng';
import type { Enemy } from '../game/types';
import { assert } from './test-utils';

export function runEnemyAITests(): void {
  const state = createNewGame(9191);
  state.player.position = { x: 2, y: 2 };
  state.enemies = [
    {
      id: 'edge-enemy',
      kindId: 'mayoi-tanuki',
      name: '迷い狸',
      hp: 5,
      maxHp: 5,
      attack: 0,
      defense: 0,
      exp: 0,
      score: 0,
      position: { x: 0, y: 0 },
      awakeRange: 0,
      moveEvery: 1,
    } satisfies Enemy,
  ];

  const next = runEnemyPhase(state, createRng(1));
  const enemy = next.enemies[0];
  assert(enemy.position.x >= 0, 'enemy should not move outside the left map edge');
  assert(enemy.position.y >= 0, 'enemy should not move outside the top map edge');
  assert(enemy.position.x < next.map.width, 'enemy should not move outside the right map edge');
  assert(enemy.position.y < next.map.height, 'enemy should not move outside the bottom map edge');
}
