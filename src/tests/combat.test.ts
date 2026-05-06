import { calculateDamage, didHit } from '../game/combat';
import { createRng } from '../game/rng';
import { assert, greaterThanOrEqual } from './test-utils';

export function runCombatTests(): void {
  const rng = createRng(1);
  for (let i = 0; i < 20; i += 1) {
    greaterThanOrEqual(calculateDamage(1, 99, rng), 1, 'damage should be at least 1');
  }

  const hitRng = createRng(2);
  assert(didHit(1, hitRng), '100% hit rate should hit');
  assert(!didHit(0, hitRng), '0% hit rate should miss');
}
