// タイトルと、冒険の結果
import { MODE_NAME } from '../content/world';
import { titleName, type Summary } from '../engine/meta';
import { ItemIcon, SpriteIcon, click, itemLabel } from './common';
import { VillageScene } from './Village';

export function TitleScreen(props: { hasRun: boolean; runInfo: string; onStart: () => void; onContinue: () => void; onAbandon: () => void }) {
  return (
    <div className="title-screen">
      <VillageScene />
      <div className="title-shade" />
      <div className="title-content">
        <div className="title-hero"><SpriteIcon name="player-down" size={112} /></div>
        <h1 className="logo">不思議なダンジョン<span>もどき</span></h1>
        <p className="subtitle">― 迷い里から、天守への道 ―</p>
        <div className="title-buttons">
          {props.hasRun ? (
            <>
              <button className="primary" onClick={click(props.onContinue)}>つづきから<small>{props.runInfo}</small></button>
              <button className="ghost" onClick={click(() => { if (window.confirm('今の冒険をあきらめますか？ 持ち物とお金は失われます。')) props.onAbandon(); })}>今の冒険をあきらめる<small>持ち物は失われる</small></button>
            </>
          ) : (
            <button className="primary" onClick={click(props.onStart)}>はじめる<small>村へ</small></button>
          )}
        </div>
        <p className="credit">v2.0 ・ 毎回形の変わる迷宮で、一手ずつ生き延びよう</p>
      </div>
    </div>
  );
}

export function ResultScreen({ s, onVillage }: { s: Summary; onVillage: () => void }) {
  const head = s.kind === 'clear' ? '踏破！' : s.kind === 'return' ? '村へ帰還した' : s.kind === 'quit' ? '冒険をあきらめた' : '力尽きた……';
  return (
    <div className={`result-screen ${s.kind}`}>
      <div className="result-card">
        <p className="mode">{MODE_NAME[s.mode]}</p>
        <h1>{head}</h1>
        <p className="where">{s.floor}階{s.kind === 'dead' ? `で ${s.cause} に倒された` : ''}</p>
        {s.score !== undefined && <p className="score">得点 <b>{s.score}</b>{s.dailyBest ? '（本日の本番として記録）' : '（練習）'}</p>}
        {s.unlockedDeep && <p className="unlock">新しい迷宮「{MODE_NAME.deep}」が開いた！</p>}
        {s.newTitles.length > 0 && (
          <div className="new-titles">
            <h3>新しい称号</h3>
            {s.newTitles.map((t) => <span key={t} className="chip good">{titleName(t)}</span>)}
          </div>
        )}
        {s.kept.length > 0 && (
          <div className="kept">
            <h3>倉庫へ持ち帰った物（{s.kept.length}）・{s.gold}文</h3>
            <div className="kept-list">{s.kept.map((i) => <span key={i.uid} className="kept-item"><ItemIcon id={i.id} size={22} />{itemLabel(null, i)}</span>)}</div>
          </div>
        )}
        {s.kind !== 'return' && s.kind !== 'clear' && s.lost.length > 0 && <p className="lost">持ち物 {s.lost.length} 個は失われた。</p>}
        <button className="primary big" onClick={click(onVillage)}>村へ戻る</button>
      </div>
    </div>
  );
}
