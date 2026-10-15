import { MON_BY_ID } from '../content/monsters';
import type { Monster } from '../engine/types';
/** 段階表示から変装・不可視・視界外の正体を漏らさない。 */
export function tierLabel(m: Monster | null, visible: boolean, enabled: boolean): string {
  if (!enabled || !visible || !m || m.dead || m.disguise || m.role) return '';
  const def = MON_BY_ID[m.id];
  if (!def || def.special || def.invisible) return '';
  return ['', 'Ⅰ', 'Ⅱ', 'Ⅲ'][def.tier] ?? '';
}
