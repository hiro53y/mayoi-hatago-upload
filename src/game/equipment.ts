import { BASE_HIT_RATE } from './constants';
import { getItemDefinition } from './items';
import type { InventoryItem, Player } from './types';

function findEquippedItem(player: Player, instanceId: string | null): InventoryItem | null {
  if (!instanceId) return null;
  return player.inventory.find((item) => item.instanceId === instanceId) ?? null;
}

export function getEquippedWeapon(player: Player): InventoryItem | null {
  return findEquippedItem(player, player.equipment.weaponId);
}

export function getEquippedArmor(player: Player): InventoryItem | null {
  return findEquippedItem(player, player.equipment.armorId);
}

export function getPlayerAttack(player: Player): number {
  const weapon = getEquippedWeapon(player);
  const bonus = weapon ? getItemDefinition(weapon.itemId).attackBonus ?? 0 : 0;
  return player.baseAttack + bonus;
}

export function getPlayerDefense(player: Player): number {
  const armor = getEquippedArmor(player);
  const bonus = armor ? getItemDefinition(armor.itemId).defenseBonus ?? 0 : 0;
  return player.baseDefense + bonus;
}

export function getPlayerHitRate(player: Player): number {
  const weapon = getEquippedWeapon(player);
  const weaponModifier = weapon ? getItemDefinition(weapon.itemId).hitModifier ?? 0 : 0;
  const blindPenalty = player.statusEffects.some((effect) => effect.type === 'blind') ? -0.22 : 0;
  return Math.max(0.45, Math.min(0.98, BASE_HIT_RATE + weaponModifier + blindPenalty));
}

export function getStatusResistance(player: Player): number {
  const armor = getEquippedArmor(player);
  return armor ? getItemDefinition(armor.itemId).statusResist ?? 0 : 0;
}
