import { getItemDefinition } from '../game/items';
import type { Player } from '../game/types';

interface Props {
  player: Player;
  onUse: (instanceId: string) => void;
  onDrop: (instanceId: string) => void;
  onEquip: (instanceId: string) => void;
  onClose: () => void;
}

export default function InventoryModal({ player, onUse, onDrop, onEquip, onClose }: Props) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-panel inventory-modal">
        <header className="modal-header">
          <div>
            <h2>道具袋</h2>
            <p>{player.inventory.length}/12</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>
        {player.inventory.length === 0 ? (
          <p className="empty-state">道具はまだない。</p>
        ) : (
          <ul className="item-list">
            {player.inventory.map((item) => {
              const definition = getItemDefinition(item.itemId);
              const equipped =
                player.equipment.weaponId === item.instanceId || player.equipment.armorId === item.instanceId;
              const canEquip = definition.category === 'weapon' || definition.category === 'armor';
              return (
                <li key={item.instanceId} className={equipped ? 'equipped-item' : ''}>
                  <div className="item-copy">
                    <strong>
                      {definition.name}
                      {equipped ? '（装備中）' : ''}
                    </strong>
                    <span>{definition.description}</span>
                  </div>
                  <div className="item-actions">
                    <button type="button" onClick={() => (canEquip ? onEquip(item.instanceId) : onUse(item.instanceId))}>
                      {canEquip ? '装備' : '使う'}
                    </button>
                    <button type="button" onClick={() => onDrop(item.instanceId)}>
                      捨てる
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
