import { expRequiredForNextLevel } from '../game/score';
import { getPlayerAttack, getPlayerDefense } from '../game/equipment';
import type { GameState, StatusEffect } from '../game/types';

interface Props {
  state: GameState;
}

function Meter({ value, max, className }: { value: number; max: number; className: string }) {
  const ratio = Math.max(0, Math.min(1, value / max));
  return (
    <span className={`meter ${className}`}>
      <span style={{ width: `${ratio * 100}%` }} />
    </span>
  );
}

export default function StatusBar({ state }: Props) {
  const { player } = state;
  const nextExp = expRequiredForNextLevel(player.level);
  const statusLabels: Record<StatusEffect['type'], string> = {
    poison: '毒',
    blind: '目暗',
    slow: '鈍足',
    swift: '俊足',
    vision: '透視',
  };

  return (
    <header className="status-bar">
      <div className="primary-status">
        <div>
          <span>HP</span>
          <strong>
            {player.hp}/{player.maxHp}
          </strong>
          <Meter value={player.hp} max={player.maxHp} className="hp-meter" />
        </div>
        <div>
          <span>満腹</span>
          <strong>
            {player.hunger}/{player.maxHunger}
          </strong>
          <Meter value={player.hunger} max={player.maxHunger} className="hunger-meter" />
        </div>
      </div>
      <dl className="compact-status">
        <div>
          <dt>階</dt>
          <dd>{state.floor}</dd>
        </div>
        <div>
          <dt>Lv</dt>
          <dd>{player.level}</dd>
        </div>
        <div>
          <dt>Exp</dt>
          <dd>
            {player.exp}/{nextExp}
          </dd>
        </div>
        <div>
          <dt>攻/防</dt>
          <dd>
            {getPlayerAttack(player)}/{getPlayerDefense(player)}
          </dd>
        </div>
        <div>
          <dt>点</dt>
          <dd>{player.score.toLocaleString('ja-JP')}</dd>
        </div>
      </dl>
      {player.statusEffects.length > 0 && (
        <div className="status-effects" aria-label="状態異常">
          {player.statusEffects.map((effect) => (
            <span key={effect.type}>
              {statusLabels[effect.type]} {effect.turns}
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
