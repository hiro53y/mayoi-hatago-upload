import { ENEMY_DEFINITIONS } from '../game/balance';
import { ITEM_DEFINITIONS } from '../game/items';
import type { Records } from '../game/types';

interface Props {
  records: Records;
  onBack: () => void;
}

export default function RecordsScreen({ records, onBack }: Props) {
  const discoveredItemNames = records.discoveredItems
    .map((id) => ITEM_DEFINITIONS.find((item) => item.id === id)?.name)
    .filter(Boolean);
  const discoveredEnemyNames = records.discoveredEnemies
    .map((id) => ENEMY_DEFINITIONS.find((enemy) => enemy.id === id)?.name)
    .filter(Boolean);

  return (
    <section className="records-screen">
      <header className="screen-header">
        <h1>記録</h1>
        <button type="button" className="secondary-button" onClick={onBack}>
          戻る
        </button>
      </header>
      <dl className="records-grid">
        <div>
          <dt>総プレイ回数</dt>
          <dd>{records.totalRuns}</dd>
        </div>
        <div>
          <dt>最高到達階層</dt>
          <dd>{records.bestFloor}階</dd>
        </div>
        <div>
          <dt>踏破回数</dt>
          <dd>{records.clearCount}</dd>
        </div>
        <div>
          <dt>総討伐数</dt>
          <dd>{records.totalKills}</dd>
        </div>
        <div>
          <dt>最高スコア</dt>
          <dd>{records.bestScore.toLocaleString('ja-JP')}</dd>
        </div>
        <div>
          <dt>累計ターン</dt>
          <dd>{records.totalTurns}</dd>
        </div>
      </dl>
      <section className="collection-panel">
        <h2>発見済みの道具</h2>
        <p>{discoveredItemNames.length > 0 ? discoveredItemNames.join('、') : '未発見'}</p>
      </section>
      <section className="collection-panel">
        <h2>発見済みの敵</h2>
        <p>{discoveredEnemyNames.length > 0 ? discoveredEnemyNames.join('、') : '未発見'}</p>
      </section>
    </section>
  );
}
