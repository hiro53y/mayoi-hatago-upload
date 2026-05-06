import type { Records } from '../game/types';

interface Props {
  hasSave: boolean;
  records: Records;
  onNewGame: () => void;
  onContinue: () => void;
  onHelp: () => void;
  onRecords: () => void;
}

export default function TitleScreen({ hasSave, records, onNewGame, onContinue, onHelp, onRecords }: Props) {
  return (
    <section className="title-screen">
      <div className="title-lantern" aria-hidden="true" />
      <p className="eyebrow">Turn-based dungeon roguelike</p>
      <h1>迷宮旅籠</h1>
      <p className="subtitle">Mayoi Hatago</p>
      <div className="title-actions">
        <button className="primary-button" type="button" onClick={onNewGame}>
          新しく始める
        </button>
        <button className="secondary-button" type="button" onClick={onContinue} disabled={!hasSave}>
          続きから
        </button>
        <button className="secondary-button" type="button" onClick={onHelp}>
          遊び方
        </button>
        <button className="secondary-button" type="button" onClick={onRecords}>
          記録
        </button>
      </div>
      <dl className="title-records">
        <div>
          <dt>最高到達</dt>
          <dd>{records.bestFloor}階</dd>
        </div>
        <div>
          <dt>最高スコア</dt>
          <dd>{records.bestScore.toLocaleString('ja-JP')}</dd>
        </div>
        <div>
          <dt>踏破</dt>
          <dd>{records.clearCount}回</dd>
        </div>
      </dl>
      <p className="credits">Original game by this project. No third-party names, story, art, music, or sound assets are used.</p>
    </section>
  );
}
