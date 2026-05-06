import type { GameResult } from '../game/types';

interface Props {
  result: GameResult;
  onRetry: () => void;
  onTitle: () => void;
}

export default function ResultScreen({ result, onRetry, onTitle }: Props) {
  const isClear = result.outcome === 'clear';

  return (
    <section className={`result-screen ${isClear ? 'clear-result' : 'lost-result'}`}>
      <p className="eyebrow">{isClear ? 'Clear' : 'Game Over'}</p>
      <h1>{isClear ? '10階到達' : '旅はここまで'}</h1>
      <p className="result-cause">{result.cause}</p>
      <dl className="result-stats">
        <div>
          <dt>到達階層</dt>
          <dd>{result.floor}階</dd>
        </div>
        <div>
          <dt>レベル</dt>
          <dd>{result.level}</dd>
        </div>
        <div>
          <dt>討伐数</dt>
          <dd>{result.kills}</dd>
        </div>
        <div>
          <dt>使用道具</dt>
          <dd>{result.itemsUsed}</dd>
        </div>
        <div>
          <dt>ターン</dt>
          <dd>{result.turns}</dd>
        </div>
        <div>
          <dt>スコア</dt>
          <dd>{result.score.toLocaleString('ja-JP')}</dd>
        </div>
      </dl>
      <div className="title-actions">
        <button className="primary-button" type="button" onClick={onRetry}>
          もう一度遊ぶ
        </button>
        <button className="secondary-button" type="button" onClick={onTitle}>
          タイトルへ
        </button>
      </div>
    </section>
  );
}
