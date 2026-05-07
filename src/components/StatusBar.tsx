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
      <div className="hud-main">
        <span>{state.floor}F</span>
        <span>Lv {player.level}</span>
        <span className="hud-meter-block">
          HP {player.hp}/{player.maxHp}
          <Meter value={player.hp} max={player.maxHp} className="hp-meter" />
        </span>
        <span>{player.score.toLocaleString('ja-JP')}G</span>
      </div>
      <div className="hud-sub">
        <span className="hud-meter-block">
          満腹度 {player.hunger}/{player.maxHunger}
          <Meter value={player.hunger} max={player.maxHunger} className="hunger-meter" />
        </span>
        <span>Exp {player.exp}/{nextExp}</span>
        <span>攻/防 {getPlayerAttack(player)}/{getPlayerDefense(player)}</span>
      </div>
      {player.statusEffects.length > 0 && (
        <div className="status-effects" aria-label="状態異常">
          {player.statusEffects.map((effect) => (
            <span key={effect.type}>
              {statusLabels[effect.type]} {effect.turns}
            </span>
          ))}
        </div>
      )}
      <div className="floor-objective" aria-label="階層情報">
        {state.floorTheme ? <span>{state.floorTheme.name}</span> : null}
        {state.miniObjective ? (
          <span className={state.miniObjective.completed ? 'objective-complete' : ''}>
            目標 {state.miniObjective.description} {state.miniObjective.progress}/{state.miniObjective.target}
          </span>
        ) : null}
      </div>
    </header>
  );
}
