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
      const isStairs = tile?.visible && tile.kind === 'stairs';
      const className = [
        'dungeon-tile',
        tile ? `tile-${tile.kind}` : 'tile-wall',
        tile?.visible ? 'visible' : tile?.explored ? 'explored' : 'unseen',
        isPlayer ? 'player-tile' : '',
        enemy ? 'enemy-tile' : '',
        item ? 'item-tile' : '',
        isStairs ? 'stairs-tile' : '',
      ]
        .filter(Boolean)
        .join(' ');
      let label = '';
      let aria = '未探索';

      if (isPlayer) {
        label = '旅';
        aria = '旅人';
      } else if (enemy) {
        label = enemy.name.slice(0, 1);
        aria = enemy.name;
      } else if (item) {
        label = '道';
        aria = getItemDefinition(item.itemId).name;
      } else if (isStairs) {
        label = '階';
        aria = '階段';
      } else if (tile?.visible && tile.kind === 'wall') {
        label = '';
        aria = '壁';
      } else if (tile?.explored) {
        aria = '探索済み';
      }

      cells.push(
        <div key={`${position.x},${position.y}`} className={className} role="gridcell" aria-label={aria}>
          <span>{label}</span>
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
