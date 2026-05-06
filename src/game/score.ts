import type { Player } from './types';

export function expRequiredForNextLevel(level: number): number {
  return 12 + level * 9 + level * level * 3;
}

export function grantExperience(player: Player, exp: number): { player: Player; logs: string[] } {
  let nextPlayer = { ...player, exp: player.exp + exp };
  const logs: string[] = [];

  while (nextPlayer.exp >= expRequiredForNextLevel(nextPlayer.level)) {
    nextPlayer = {
      ...nextPlayer,
      exp: nextPlayer.exp - expRequiredForNextLevel(nextPlayer.level),
      level: nextPlayer.level + 1,
      maxHp: nextPlayer.maxHp + 5,
      hp: Math.min(nextPlayer.maxHp + 5, nextPlayer.hp + 10),
      baseAttack: nextPlayer.baseAttack + 1,
      baseDefense: nextPlayer.baseDefense + (nextPlayer.level % 2 === 0 ? 1 : 0),
    };
    logs.push(`レベル${nextPlayer.level}になった。力が湧いてくる。`);
  }

  return { player: nextPlayer, logs };
}

export function floorScore(floor: number): number {
  return floor * 120;
}
