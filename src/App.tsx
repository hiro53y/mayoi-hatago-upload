// 画面の切り替え：タイトル → 村 → 冒険 → 結果
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { MODE_NAME } from './content/world';
import { departure, todayKey, type Meta, type Settings, type Summary } from './engine/meta';
import { exportBackup, finalizeRun, loadMeta, loadRun, parseBackup, recoveryProblem, restoreBackup, saveMeta, saveProblem } from './engine/save';
import { BackupTools, SaveContext } from './ui/BackupTools';
import type { Run, RunMode } from './engine/types';
import { floorTrack, setBgmVolume, titleTrack, useBgm } from './audio/bgm';
import { setSeVolume } from './audio/sound';
import { GameScreen } from './ui/GameScreen';
import { Village } from './ui/Village';
import { ResultScreen, TitleScreen } from './ui/TitleResult';
import { useSpritesReady } from './ui/common';

type Screen = 'title' | 'village' | 'game' | 'result';

// 開発用の絵の一覧（本番のビルドでは読み込まない）
const Gallery = import.meta.env.DEV ? lazy(() => import('./ui/Gallery')) : null;

export default function App() {
  const ready = useSpritesReady();
  const [recovery] = useState(() => recoveryProblem());
  const [saveError, setSaveError] = useState(saveProblem);
  useEffect(() => { const update = () => setSaveError(saveProblem()); window.addEventListener('fdm-save-status', update); return () => window.removeEventListener('fdm-save-status', update); }, []);
  const [meta, setMetaState] = useState<Meta>(() => loadMeta());
  const [run, setRun] = useState<Run | null>(() => loadRun());
  const [screen, setScreen] = useState<Screen>('title');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [floor, setFloor] = useState(run?.floorNo ?? 1);

  const setMeta = useCallback((m: Meta) => { setMetaState(m); saveMeta(m); }, []);
  const settings = meta.settings;
  const setSettings = useCallback((s: Settings) => setMeta({ ...meta, settings: s }), [meta, setMeta]);

  useEffect(() => { setSeVolume(settings.se); setBgmVolume(settings.bgm); }, [settings.se, settings.bgm]);

  // 階が変わったら曲を変える
  useEffect(() => {
    if (screen !== 'game' || !run) return undefined;
    const id = window.setInterval(() => setFloor(run.floorNo), 800);
    return () => window.clearInterval(id);
  }, [screen, run]);

  const bgm = useMemo(() => {
    if (screen === 'game' && run) return floorTrack(run.mode, floor);
    if (screen === 'result') return null;
    return titleTrack();
  }, [screen, run, floor]);
  useBgm(bgm, settings.bgm);

  const depart = (mode: RunMode, carry: number[]) => {
    const copy: Meta = JSON.parse(JSON.stringify(meta));
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) | 0;
    const next = departure(copy, mode, carry, seed, mode === 'daily' ? todayKey() : undefined);
    const backup = parseBackup(exportBackup(copy, next));
    if (!backup || !restoreBackup(backup)) { setSaveError('出発を保存できませんでした。持ち込み品は変更していません。再試行してください。'); return; }
    setMetaState(copy);
    setRun(next);
    setFloor(next.floorNo);
    setScreen('game');
  };

  const end = useCallback(() => {
    if (!run) return;
    const result = finalizeRun(meta, run);
    setMetaState(result.meta);
    if (!result.ok) return;
    setSummary(result.summary);
    setRun(null);
    setScreen(result.summary ? 'result' : 'village');
  }, [run, meta, setMeta]);

  useEffect(() => { if (run?.end && !recovery) end(); }, [run, recovery, end]);

  const giveUp = useCallback(() => {
    if (!run) return;
    run.end = { kind: 'quit', cause: 'あきらめた', floor: run.floorNo };
    end();
  }, [run, end]);

  const content = () => {
  if (recovery) return <main className="recovery-screen"><h1>保存データの確認</h1><p role="alert">{recovery}</p><BackupTools recovery /></main>;
  if (!ready) return <div className="loading">迷宮を準備しています……</div>;
  if (Gallery && location.search.includes('gallery')) return <Suspense fallback={null}><Gallery /></Suspense>;

  if (screen === 'game' && run) {
    return <GameScreen key={run.seed} run={run} settings={settings} onSettings={setSettings} onEnd={end} onSuspend={() => setScreen('title')} onGiveUp={giveUp} />;
  }
  if (screen === 'result' && summary) {
    return <ResultScreen s={summary} onVillage={() => { setSummary(null); setScreen('village'); }} />;
  }
  if (screen === 'village' && !run) {
    return <Village meta={meta} onMeta={setMeta} onDepart={depart} settings={settings} onSettings={setSettings} onTitle={() => setScreen('title')} />;
  }
  return (
    <TitleScreen
      hasRun={!!run}
      runInfo={run ? `${MODE_NAME[run.mode]} ${run.floorNo}階・Lv${run.player.lv}` : ''}
      onStart={() => setScreen('village')}
      onContinue={() => setScreen('game')}
      onAbandon={giveUp}
    />
  );
  };
  return <SaveContext.Provider value={{ meta, run, restored: () => location.reload() }}>
    {saveError && <aside className="save-warning" role="alert"><p>{saveError}</p><div className="row-buttons"><button onClick={() => {
      if (run?.end) end(); else { const b = parseBackup(exportBackup(meta, run)); if (b) restoreBackup(b); }
    }}>保存を再試行</button></div><BackupTools /></aside>}
    {content()}
  </SaveContext.Provider>;
}
