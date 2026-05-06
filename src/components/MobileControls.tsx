import type { Direction } from '../game/types';
import type { PlayerCommand } from '../game/actions';

interface Props {
  facing: Direction;
  onCommand: (command: PlayerCommand) => void;
  onInventory: () => void;
  onEquipment: () => void;
  onHelp: () => void;
  onMenu: () => void;
}

function facingCommand(facing: Direction): PlayerCommand {
  if (facing === 'up') return { type: 'move', dx: 0, dy: -1 };
  if (facing === 'down') return { type: 'move', dx: 0, dy: 1 };
  if (facing === 'left') return { type: 'move', dx: -1, dy: 0 };
  return { type: 'move', dx: 1, dy: 0 };
}

export default function MobileControls({ facing, onCommand, onInventory, onEquipment, onHelp, onMenu }: Props) {
  return (
    <nav className="mobile-controls" aria-label="ゲーム操作">
      <div className="dpad" aria-label="移動">
        <button type="button" className="control-button up" onClick={() => onCommand({ type: 'move', dx: 0, dy: -1 })}>
          ↑
        </button>
        <button type="button" className="control-button left" onClick={() => onCommand({ type: 'move', dx: -1, dy: 0 })}>
          ←
        </button>
        <button type="button" className="control-button wait" onClick={() => onCommand({ type: 'wait' })}>
          待
        </button>
        <button type="button" className="control-button right" onClick={() => onCommand({ type: 'move', dx: 1, dy: 0 })}>
          →
        </button>
        <button type="button" className="control-button down" onClick={() => onCommand({ type: 'move', dx: 0, dy: 1 })}>
          ↓
        </button>
      </div>
      <div className="action-pad">
        <button type="button" className="action-button strong" onClick={() => onCommand(facingCommand(facing))}>
          攻撃
        </button>
        <button type="button" className="action-button" onClick={() => onCommand({ type: 'descend' })}>
          階段
        </button>
        <button type="button" className="action-button" onClick={onInventory}>
          道具
        </button>
        <button type="button" className="action-button" onClick={onEquipment}>
          装備
        </button>
        <button type="button" className="action-button" onClick={onHelp}>
          ？
        </button>
        <button type="button" className="action-button" onClick={onMenu}>
          メニュー
        </button>
      </div>
    </nav>
  );
}
