import type { GameState, Position } from '../game/types';
import { getItemDefinition } from '../game/items';
import { samePosition } from '../game/pathfinding';

const VIEW_SIZE = 11;
const VIEW_RADIUS = Math.floor(VIEW_SIZE / 2);

interface Props {
  state: GameState;
}

function tileAt(state: GameState, position: Position) {
  return state.map.tiles[position.y]?.[position.x] ?? null;
}

export default function DungeonView({ state }: Props) {
  const cells = [];
  for (let vy = -VIEW_RADIUS; vy <= VIEW_RADIUS; vy += 1) {
    for (let vx = -VIEW_RADIUS; vx <= VIEW_RADIUS; vx += 1) {
      const position = {
        x: state.player.position.x + vx,
        y: state.player.position.y + vy,
      };
      const tile = tileAt(state, position);
      const isPlayer = samePosition(position, state.player.position);
      const enemy = tile?.visible ? state.enemies.find((candidate) => samePosition(candidate.position, position)) : null;
      const item = tile?.visible ? state.groundItems.find((candidate) => samePosition(candidate.position, position)) : null;
      const itemDefinition = item ? getItemDefinition(item.itemId) : null;
      const isStairs = tile?.visible && tile.kind === 'stairs';
      const lastLog = state.logs[state.logs.length - 1]?.text ?? '';
      const actionVariant = state.turn % 2 === 0 ? 'even' : 'odd';
      const playerActed = isPlayer && lastLog.includes('旅人の攻撃');
      const playerWasHit = isPlayer && lastLog.includes('旅人は') && lastLog.includes('ダメージ');
      const enemyWasHit = enemy && lastLog.includes(enemy.name) && lastLog.includes('ダメージ');
      const className = [
        'dungeon-tile',
        tile ? `tile-${tile.kind}` : 'tile-wall',
        tile?.visible ? 'visible' : tile?.explored ? 'explored' : 'unseen',
        isPlayer ? 'player-tile' : '',
        playerActed ? `player-acted-${actionVariant}` : '',
        playerWasHit ? `player-hit-${actionVariant}` : '',
        enemy ? 'enemy-tile' : '',
        enemy ? `enemy-kind-${enemy.kindId}` : '',
        enemyWasHit ? `enemy-hit-${actionVariant}` : '',
        item ? 'item-tile' : '',
        itemDefinition ? `item-category-${itemDefinition.category}` : '',
        isStairs ? 'stairs-tile' : '',
      ]
        .filter(Boolean)
        .join(' ');
      let aria = '未探索';
      let spriteClass = '';

      if (isPlayer) {
        aria = '旅人';
        spriteClass = 'sprite sprite-player';
      } else if (enemy) {
        aria = enemy.name;
        spriteClass = `sprite sprite-enemy sprite-enemy-${enemy.kindId}`;
      } else if (item) {
        aria = itemDefinition?.name ?? '道具';
        spriteClass = `sprite sprite-item sprite-item-${itemDefinition?.category ?? 'support'}`;
      } else if (isStairs) {
        aria = '階段';
        spriteClass = 'sprite sprite-stairs';
      } else if (tile?.visible && tile.kind === 'wall') {
        aria = '壁';
      } else if (tile?.explored) {
        aria = '探索済み';
      }

      cells.push(
        <div key={`${position.x},${position.y}`} className={className} role="gridcell" aria-label={aria}>
          {spriteClass ? <span className={spriteClass} aria-hidden="true" /> : null}
        </div>,
      );
    }
  }

  return (
    <div className="dungeon-frame">
      <div
        className="dungeon-grid"
        role="grid"
        aria-label={`現在位置 ${state.player.position.x},${state.player.position.y}`}
        style={{ gridTemplateColumns: `repeat(${VIEW_SIZE}, 1fr)` }}
      >
        {cells}
      </div>
    </div>
  );
}
