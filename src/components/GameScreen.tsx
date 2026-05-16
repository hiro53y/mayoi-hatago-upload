import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../game/types';
import type { PlayerCommand } from '../game/actions';
import { playSlashHitSe } from '../game/sound';
import DungeonView from './DungeonView';
import StatusBar from './StatusBar';
import MobileControls from './MobileControls';
import InventoryModal from './InventoryModal';
import EquipmentPanel from './EquipmentPanel';
import LogPanel from './LogPanel';
import HelpModal from './HelpModal';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  state: GameState;
  onCommand: (command: PlayerCommand) => void;
  onBackToTitle: () => void;
}

type Modal = 'inventory' | 'equipment' | 'log' | 'help' | 'menu' | null;

export default function GameScreen({ state, onCommand, onBackToTitle }: Props) {
  const [modal, setModal] = useState<Modal>(null);
  const lastSeEventId = useRef(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (modal) {
        if (event.key === 'Escape') setModal(null);
        return;
      }

      const lower = event.key.toLowerCase();
      const commandByKey: Record<string, PlayerCommand | undefined> = {
        arrowup: { type: 'move', dx: 0, dy: -1 },
        w: { type: 'move', dx: 0, dy: -1 },
        arrowdown: { type: 'move', dx: 0, dy: 1 },
        s: { type: 'move', dx: 0, dy: 1 },
        arrowleft: { type: 'move', dx: -1, dy: 0 },
        a: { type: 'move', dx: -1, dy: 0 },
        arrowright: { type: 'move', dx: 1, dy: 0 },
        d: { type: 'move', dx: 1, dy: 0 },
        ' ': { type: 'wait' },
        g: { type: 'descend' },
        '>': { type: 'descend' },
        enter: { type: 'wait' },
      };

      if (lower === 'i') {
        event.preventDefault();
        setModal('inventory');
        return;
      }
      if (lower === 'e') {
        event.preventDefault();
        setModal('equipment');
        return;
      }
      if (event.key === '?') {
        event.preventDefault();
        setModal('help');
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setModal('menu');
        return;
      }

      const command = commandByKey[lower];
      if (command) {
        event.preventDefault();
        onCommand(command);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal, onCommand]);

  useEffect(() => {
    const hitEvents = (state.visualEvents ?? []).filter(
      (event) => event.kind === 'playerAttack' && event.hit && event.damage && event.id > lastSeEventId.current,
    );
    if (hitEvents.length === 0) return;
    lastSeEventId.current = Math.max(...hitEvents.map((event) => event.id));
    playSlashHitSe();
  }, [state.visualEvents]);

  const closeModal = () => setModal(null);

  return (
    <section className={`game-screen ${state.player.hp <= 8 ? 'danger' : ''} ${state.player.hunger <= 0 ? 'starving' : ''}`}>
      <div className="playfield">
        <StatusBar state={state} />
        <DungeonView state={state} />
        <LogPanel logs={state.logs} onOpen={() => setModal('log')} />
      </div>
      <MobileControls
        facing={state.player.facing}
        onCommand={onCommand}
        onInventory={() => setModal('inventory')}
        onEquipment={() => setModal('equipment')}
        onHelp={() => setModal('help')}
        onMenu={() => setModal('menu')}
      />
      {modal === 'inventory' && (
        <InventoryModal
          player={state.player}
          onUse={(instanceId) => {
            closeModal();
            onCommand({ type: 'useItem', instanceId });
          }}
          onDrop={(instanceId) => {
            closeModal();
            onCommand({ type: 'dropItem', instanceId });
          }}
          onEquip={(instanceId) => {
            closeModal();
            onCommand({ type: 'equipItem', instanceId });
          }}
          onClose={closeModal}
        />
      )}
      {modal === 'equipment' && (
        <EquipmentPanel
          player={state.player}
          onUnequip={(slot) => {
            closeModal();
            onCommand({ type: 'unequip', slot });
          }}
          onClose={closeModal}
        />
      )}
      {modal === 'log' && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal-panel log-modal">
            <header className="modal-header">
              <h2>旅の記録</h2>
              <button type="button" className="icon-button" onClick={closeModal} aria-label="閉じる">
                ×
              </button>
            </header>
            <ol className="full-log-list">
              {state.logs.map((log) => (
                <li key={log.id} className={`log-${log.tone ?? 'normal'}`}>
                  <span>{log.turn}</span>
                  {log.text}
                  {(log.count ?? 1) > 1 ? <b className="log-repeat">×{log.count}</b> : null}
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
      {modal === 'help' && <HelpModal onClose={closeModal} />}
      {modal === 'menu' && (
        <ConfirmDialog
          title="タイトルへ戻る"
          message="進行は直近の行動ごとに保存されています。タイトルへ戻りますか。"
          confirmLabel="戻る"
          cancelLabel="続ける"
          onConfirm={onBackToTitle}
          onCancel={closeModal}
        />
      )}
    </section>
  );
}
