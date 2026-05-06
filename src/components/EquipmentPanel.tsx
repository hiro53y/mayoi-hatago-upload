import { getPlayerAttack, getPlayerDefense, getEquippedArmor, getEquippedWeapon } from '../game/equipment';
import { getItemDefinition } from '../game/items';
import type { EquipmentSlot, Player } from '../game/types';

interface Props {
  player: Player;
  onUnequip: (slot: EquipmentSlot) => void;
  onClose: () => void;
}

export default function EquipmentPanel({ player, onUnequip, onClose }: Props) {
  const weapon = getEquippedWeapon(player);
  const armor = getEquippedArmor(player);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel equipment-modal">
        <header className="modal-header">
          <h2>装備</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>
        <dl className="equipment-stats">
          <div>
            <dt>攻撃力</dt>
            <dd>{getPlayerAttack(player)}</dd>
          </div>
          <div>
            <dt>防御力</dt>
            <dd>{getPlayerDefense(player)}</dd>
          </div>
        </dl>
        <div className="equipment-slot">
          <div>
            <span>武器</span>
            <strong>{weapon ? getItemDefinition(weapon.itemId).name : 'なし'}</strong>
          </div>
          <button type="button" onClick={() => onUnequip('weapon')} disabled={!weapon}>
            外す
          </button>
        </div>
        <div className="equipment-slot">
          <div>
            <span>防具</span>
            <strong>{armor ? getItemDefinition(armor.itemId).name : 'なし'}</strong>
          </div>
          <button type="button" onClick={() => onUnequip('armor')} disabled={!armor}>
            外す
          </button>
        </div>
      </section>
    </div>
  );
}
