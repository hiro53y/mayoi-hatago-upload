import type { Rng } from './rng';

export function calculateDamage(attackerAttack: number, defenderDefense: number, rng: Rng): number {
  const variance = rng.int(-1, 2);
  return Math.max(1, attackerAttack - defenderDefense + variance);
}

export function didHit(hitRate: number, rng: Rng): boolean {
  return rng.chance(hitRate);
}
