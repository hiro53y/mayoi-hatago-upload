import type { ItemCategory } from '../game/types';

interface Props {
  kind: 'player' | 'enemy' | 'item' | 'stairs';
  enemyKind?: string;
  itemCategory?: ItemCategory;
}

function Shadow() {
  return <ellipse cx="32" cy="56" rx="19" ry="5" fill="rgba(0,0,0,.35)" />;
}

export default function DungeonSprite({ kind, enemyKind, itemCategory }: Props) {
  if (kind === 'player') {
    return (
      <svg className="game-sprite player-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M18 24c3-10 10-16 14-16s11 6 14 16" fill="#d5a94f" />
        <path d="M10 25c8-9 36-9 44 0-5 4-39 4-44 0Z" fill="#e9c86f" stroke="#6d4527" strokeWidth="2" />
        <path d="M22 28c0-7 5-12 10-12s10 5 10 12v3H22v-3Z" fill="#2b1b15" />
        <circle cx="32" cy="30" r="8" fill="#f0c9a3" />
        <path d="M22 38c2-6 18-6 20 0l3 16H19l3-16Z" fill="#29506f" stroke="#142737" strokeWidth="2" />
        <path d="M28 38v15M36 38v15" stroke="#f2eadf" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 41 12 51M44 39l9-8" stroke="#d9d3c4" strokeWidth="3" strokeLinecap="round" />
        <path d="M48 28 59 17" stroke="#f4f0e6" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 26 60 16" stroke="#7f8d96" strokeWidth="5" strokeLinecap="round" />
        <circle cx="29" cy="31" r="1.4" fill="#251a16" />
        <circle cx="36" cy="31" r="1.4" fill="#251a16" />
        <path d="M28 35c3 2 6 2 9 0" stroke="#6d352a" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'stairs') {
    return (
      <svg className="game-sprite stairs-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M16 45 48 21v8L16 53v-8Z" fill="#8b5d32" />
        <path d="M18 37 47 15v7L18 44v-7Z" fill="#c08a49" />
        <path d="M15 47h28M20 39h28M25 31h27M31 23h21" stroke="#f1d389" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'item') {
    return <ItemSprite category={itemCategory ?? 'support'} />;
  }

  return <EnemySprite enemyKind={enemyKind ?? 'mayoi-tanuki'} />;
}

function ItemSprite({ category }: { category: ItemCategory }) {
  if (category === 'food') {
    return (
      <svg className="game-sprite item-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M18 34c4-12 24-12 28 0 5 16-33 16-28 0Z" fill="#f4ead8" stroke="#7c4b2f" strokeWidth="2" />
        <path d="M19 39c7 7 19 7 26 0v8c-8 6-18 6-26 0v-8Z" fill="#463627" />
        <circle cx="29" cy="33" r="2" fill="#503328" />
      </svg>
    );
  }
  if (category === 'healing') {
    return (
      <svg className="game-sprite item-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M31 12c8 5 16 15 16 27 0 10-7 17-15 17S17 49 17 39c0-12 8-22 14-27Z" fill="#7ead55" stroke="#304c2a" strokeWidth="3" />
        <path d="M26 35h12M32 29v12" stroke="#eef6d9" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (category === 'weapon') {
    return (
      <svg className="game-sprite item-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M44 9 52 17 24 45l-8-8L44 9Z" fill="#dbe6e8" stroke="#6f7f86" strokeWidth="2" />
        <path d="M19 41 12 48l4 4 7-7" fill="#6d3f2b" stroke="#2d1d16" strokeWidth="2" />
        <path d="M18 36 28 46" stroke="#d7a84b" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (category === 'armor') {
    return (
      <svg className="game-sprite item-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M19 17c7 5 19 5 26 0l5 12c-3 18-10 25-18 29-8-4-15-11-18-29l5-12Z" fill="#586874" stroke="#1d2a33" strokeWidth="3" />
        <path d="M24 28h16M27 38h10" stroke="#b9c5c9" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (category === 'offense') {
    return (
      <svg className="game-sprite item-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M30 7 50 32H37l7 25-29-32h14L30 7Z" fill="#f2c35b" stroke="#8e3428" strokeWidth="3" />
        <path d="M29 22 39 32h-7l4 11" stroke="#fff4bf" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="game-sprite item-sprite" viewBox="0 0 64 64" aria-hidden="true">
      <Shadow />
      <circle cx="32" cy="33" r="17" fill="#5f7890" stroke="#1c303f" strokeWidth="3" />
      <circle cx="32" cy="33" r="8" fill="#efe4d2" />
      <path d="M32 12v9M32 45v8M11 33h9M44 33h9" stroke="#d7a84b" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function EnemySprite({ enemyKind }: { enemyKind: string }) {
  if (enemyKind === 'kusakage-kitsune') {
    return (
      <svg className="game-sprite enemy-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M45 39c8-7 6-19-2-23 2 10-5 14-12 18" fill="#d98a3d" stroke="#5a2d20" strokeWidth="3" />
        <path d="M19 23 15 9l12 8M45 23l4-14-12 8" fill="#d98a3d" stroke="#5a2d20" strokeWidth="3" />
        <path d="M18 24c4-10 24-10 28 0 5 13-2 27-14 27S13 37 18 24Z" fill="#c96d35" stroke="#5a2d20" strokeWidth="3" />
        <path d="M24 30h16" stroke="#f5d286" strokeWidth="4" strokeLinecap="round" />
        <circle cx="25" cy="30" r="2" fill="#2b1714" />
        <circle cx="39" cy="30" r="2" fill="#2b1714" />
        <path d="M29 37c2 2 4 2 6 0" stroke="#2b1714" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (enemyKind === 'tsuchikure-musha' || enemyKind === 'sabi-yoroi') {
    return (
      <svg className="game-sprite enemy-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M18 22h28l5 9-5 21H18l-5-21 5-9Z" fill={enemyKind === 'sabi-yoroi' ? '#6f5147' : '#6c6760'} stroke="#25211f" strokeWidth="3" />
        <path d="M20 16h24l5 8H15l5-8Z" fill="#34302c" stroke="#151311" strokeWidth="3" />
        <path d="M22 32h20" stroke="#f1cc72" strokeWidth="4" strokeLinecap="round" />
        <circle cx="26" cy="32" r="2" fill="#1a100c" />
        <circle cx="38" cy="32" r="2" fill="#1a100c" />
        <path d="M49 21 57 14" stroke="#bcc7c9" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  if (enemyKind === 'akari-onibi') {
    return (
      <svg className="game-sprite enemy-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M33 7c12 12 19 22 13 36-4 9-13 13-22 10-9-4-12-13-8-22 2-5 6-8 7-15 4 6 4 10 3 14 8-7 6-15 7-23Z" fill="#d95f35" stroke="#5e2530" strokeWidth="3" />
        <path d="M34 24c7 7 8 14 3 20-4 4-10 4-14 0 6-2 7-7 6-13 3 3 4 4 5 6 2-5 0-9 0-13Z" fill="#f5ce69" />
        <circle cx="28" cy="35" r="2" fill="#4c1c22" />
        <circle cx="38" cy="35" r="2" fill="#4c1c22" />
      </svg>
    );
  }
  if (enemyKind === 'harapeko-kappa') {
    return (
      <svg className="game-sprite enemy-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M17 25c3-12 27-12 30 0 5 18-4 29-15 29S12 43 17 25Z" fill="#6f9658" stroke="#263d23" strokeWidth="3" />
        <path d="M23 18c5-7 13-7 18 0-4 4-14 4-18 0Z" fill="#e4c063" stroke="#4c3d1f" strokeWidth="2" />
        <path d="M22 32h20" stroke="#f2d98b" strokeWidth="4" strokeLinecap="round" />
        <circle cx="26" cy="32" r="2" fill="#152014" />
        <circle cx="38" cy="32" r="2" fill="#152014" />
        <path d="M28 43h8" stroke="#263d23" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (enemyKind === 'kage-boshi') {
    return (
      <svg className="game-sprite enemy-sprite" viewBox="0 0 64 64" aria-hidden="true">
        <Shadow />
        <path d="M32 9c13 8 18 18 16 31-2 10-9 15-16 15s-14-5-16-15c-2-13 3-23 16-31Z" fill="#3a304d" stroke="#15101d" strokeWidth="3" />
        <path d="M22 31c5-5 15-5 20 0" stroke="#9e82d4" strokeWidth="4" strokeLinecap="round" />
        <circle cx="26" cy="33" r="2" fill="#efe4ff" />
        <circle cx="38" cy="33" r="2" fill="#efe4ff" />
        <path d="M21 47c6 4 16 4 22 0" stroke="#17120f" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="game-sprite enemy-sprite" viewBox="0 0 64 64" aria-hidden="true">
      <Shadow />
      <path d="M20 22 14 12l12 4M44 22l6-10-12 4" fill="#9e553a" stroke="#3d2118" strokeWidth="3" />
      <path d="M16 27c3-13 29-13 32 0 4 17-5 27-16 27S12 44 16 27Z" fill="#8e4235" stroke="#3d2118" strokeWidth="3" />
      <path d="M22 32h20" stroke="#f1c46b" strokeWidth="5" strokeLinecap="round" />
      <circle cx="25" cy="32" r="2" fill="#321813" />
      <circle cx="39" cy="32" r="2" fill="#321813" />
      <path d="M28 41c2 2 6 2 8 0" stroke="#2d1712" strokeWidth="3" strokeLinecap="round" />
      <path d="M45 45c8 0 11-7 8-13" fill="none" stroke="#6b3326" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
