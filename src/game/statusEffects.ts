import { VIEW_RADIUS } from './constants';
import type { Player, StatusEffect, StatusEffectType } from './types';

export function hasStatusEffect(player: Player, type: StatusEffectType): boolean {
  return player.statusEffects.some((effect) => effect.type === type && effect.turns > 0);
}

export function addOrRefreshStatus(
  effects: StatusEffect[],
  nextEffect: StatusEffect,
): StatusEffect[] {
  const existing = effects.find((effect) => effect.type === nextEffect.type);
  if (!existing) return [...effects, nextEffect];
  return effects.map((effect) =>
    effect.type === nextEffect.type
      ? { ...effect, turns: Math.max(effect.turns, nextEffect.turns), potency: nextEffect.potency ?? effect.potency }
      : effect,
  );
}

export function removeNegativeStatuses(player: Player): Player {
  return {
    ...player,
    statusEffects: player.statusEffects.filter(
      (effect) => !['poison', 'blind', 'slow'].includes(effect.type),
    ),
  };
}

export function getVisionRadius(player: Player): number {
  let radius = VIEW_RADIUS;
  if (hasStatusEffect(player, 'blind')) radius -= 2;
  if (hasStatusEffect(player, 'vision')) radius += 3;
  return Math.max(2, radius);
}

export function tickStatusEffects(player: Player): { player: Player; logs: string[] } {
  const logs: string[] = [];
  let nextPlayer = { ...player, statusEffects: [...player.statusEffects] };

  if (hasStatusEffect(nextPlayer, 'poison')) {
    nextPlayer = { ...nextPlayer, hp: Math.max(0, nextPlayer.hp - 2) };
    logs.push('毒が体を巡り、旅人は2ダメージを受けた。');
  }

  const remaining = nextPlayer.statusEffects
    .map((effect) => ({ ...effect, turns: effect.turns - 1 }))
    .filter((effect) => {
      if (effect.turns > 0) return true;
      if (effect.type === 'blind') logs.push('目くらましが晴れた。');
      if (effect.type === 'poison') logs.push('毒が抜けた。');
      if (effect.type === 'slow') logs.push('鈍足が解けた。');
      if (effect.type === 'swift') logs.push('逃げ足の効き目が切れた。');
      if (effect.type === 'vision') logs.push('透き見の香りが薄れた。');
      return false;
    });

  return {
    player: { ...nextPlayer, statusEffects: remaining },
    logs,
  };
}
