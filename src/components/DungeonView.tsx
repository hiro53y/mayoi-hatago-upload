import type { GameState, Position } from '../game/types';
import { getItemDefinition } from '../game/items';
import { floorThemeClass, getTrapName } from '../game/floorFeatures';
import { samePosition } from '../game/pathfinding';
import DungeonSprite from './DungeonSprite';

const VIEW_SIZE = 11;
const VIEW_RADIUS = Math.floor(VIEW_SIZE / 2);

interface Props {
  state: GameState;
}

function tileAt(state: GameState, position: Position) {
  return state.map.tiles[position.y]?.[position.x] ?? null;
}

function MiniMap({ state }: Props) {
  const cells = [];
  const enemyPositions = new Set(state.enemies.map((enemy) => `${enemy.position.x},${enemy.position.y}`));
  const itemPositions = new Set(state.groundItems.map((item) => `${item.position.x},${item.position.y}`));
  const trapPositions = new Set(
    (state.traps ?? [])
      .filter((trap) => trap.revealed && !trap.triggered)
      .map((trap) => `${trap.position.x},${trap.position.y}`),
  );

  for (let y = 0; y < state.map.height; y += 1) {
    for (let x = 0; x < state.map.width; x += 1) {
      const tile = state.map.tiles[y][x];
      const key = `${x},${y}`;
      const isPlayer = state.player.position.x === x && state.player.position.y === y;
      const isStairs = state.map.stairs.x === x && state.map.stairs.y === y;
      const className = [
        'mini-cell',
        tile.explored ? 'mini-explored' : '',
        tile.visible ? 'mini-visible' : '',
        tile.kind === 'wall' ? 'mini-wall' : '',
        isStairs && tile.explored ? 'mini-stairs' : '',
        itemPositions.has(key) && tile.visible ? 'mini-item' : '',
        trapPositions.has(key) && tile.explored ? 'mini-trap' : '',
        enemyPositions.has(key) && tile.visible ? 'mini-enemy' : '',
        isPlayer ? 'mini-player' : '',
      ]
        .filter(Boolean)
        .join(' ');
      cells.push(<span key={key} className={className} />);
    }
  }

  return (
    <div
      className="mini-map"
      aria-hidden="true"
      style={{
        gridTemplateColumns: `repeat(${state.map.width}, 1fr)`,
      }}
    >
      {cells}
    </div>
  );
}

export default function DungeonView({ state }: Props) {
  const cells = [];
  const visualEvents = state.visualEvents ?? [];
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
      const trap =
        tile?.visible || tile?.explored
          ? (state.traps ?? []).find(
              (candidate) =>
                candidate.revealed && !candidate.triggered && samePosition(candidate.position, position),
            )
          : null;
      const itemDefinition = item ? getItemDefinition(item.itemId) : null;
      const isStairs = tile?.visible && tile.kind === 'stairs';
      const playerAttackSource = isPlayer
        ? visualEvents.find((event) => event.kind === 'playerAttack' && samePosition(event.source, position))
        : null;
      const playerAttackTarget = visualEvents.find((event) => event.kind === 'playerAttack' && samePosition(event.target, position));
      const enemyAttackSource = enemy
        ? visualEvents.find((event) => event.kind === 'enemyAttack' && samePosition(event.source, position))
        : null;
      const playerHit = isPlayer
        ? visualEvents.find((event) => event.kind === 'enemyAttack' && event.hit && samePosition(event.target, position))
        : null;
      const enemyHit = visualEvents.find((event) => event.kind === 'playerAttack' && event.hit && samePosition(event.target, position));
      const hitEvent = playerHit ?? enemyHit;
      const playerActionVariant = playerAttackSource?.id && playerAttackSource.id % 2 === 0 ? 'even' : 'odd';
      const enemyActionVariant = enemyAttackSource?.id && enemyAttackSource.id % 2 === 0 ? 'even' : 'odd';
      const playerHitVariant = playerHit?.id && playerHit.id % 2 === 0 ? 'even' : 'odd';
      const enemyHitVariant = enemyHit?.id && enemyHit.id % 2 === 0 ? 'even' : 'odd';
      const className = [
        'dungeon-tile',
        tile ? `tile-${tile.kind}` : 'tile-wall',
        tile?.visible ? 'visible' : tile?.explored ? 'explored' : 'unseen',
        isPlayer ? 'player-tile' : '',
        isPlayer ? `player-facing-${state.player.facing}` : '',
        playerAttackSource ? `player-acted-${playerActionVariant}` : '',
        playerHit ? `player-hit-${playerHitVariant}` : '',
        enemy ? 'enemy-tile' : '',
        enemy ? `enemy-kind-${enemy.kindId}` : '',
        enemyHit ? `enemy-hit-${enemyHitVariant}` : '',
        playerAttackTarget ? `attack-target-${playerAttackTarget.id % 2 === 0 ? 'even' : 'odd'}` : '',
        enemyAttackSource ? `enemy-strike-source-${enemyActionVariant}` : '',
        item ? 'item-tile' : '',
        itemDefinition ? `item-category-${itemDefinition.category}` : '',
        trap ? 'trap-tile' : '',
        trap ? `trap-kind-${trap.type}` : '',
        isStairs ? 'stairs-tile' : '',
      ]
        .filter(Boolean)
        .join(' ');
      let aria = '未探索';
      let sprite = null;

      if (isPlayer) {
        aria = '旅人';
        sprite = <DungeonSprite kind="player" />;
      } else if (enemy) {
        aria = enemy.name;
        sprite = <DungeonSprite kind="enemy" enemyKind={enemy.kindId} />;
      } else if (item) {
        aria = itemDefinition?.name ?? '道具';
        sprite = <DungeonSprite kind="item" itemCategory={itemDefinition?.category} />;
      } else if (trap) {
        aria = getTrapName(trap.type);
        sprite = <DungeonSprite kind="trap" trapType={trap.type} />;
      } else if (isStairs) {
        aria = '階段';
        sprite = <DungeonSprite kind="stairs" />;
      } else if (tile?.visible && tile.kind === 'wall') {
        aria = '壁';
      } else if (tile?.explored) {
        aria = '探索済み';
      }

      cells.push(
        <div key={`${position.x},${position.y}`} className={className} role="gridcell" aria-label={aria}>
          {sprite}
          {playerAttackTarget ? (
            <span key={`slash-${playerAttackTarget.id}`} className={`attack-slash slash-${playerAttackTarget.direction}`} aria-hidden="true" />
          ) : null}
          {hitEvent ? <span key={`hit-${hitEvent.id}`} className="hit-burst" aria-hidden="true" /> : null}
          {enemyAttackSource ? <span key={`enemy-strike-${enemyAttackSource.id}`} className="enemy-strike-mark" aria-hidden="true" /> : null}
        </div>,
      );
    }
  }

  return (
    <div className={`dungeon-frame ${floorThemeClass(state.floorTheme?.id)}`}>
      <MiniMap state={state} />
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
