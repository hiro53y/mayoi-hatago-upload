import { useMemo, useState } from 'react';
import { createNewGame } from './game/gameState';
import { performPlayerAction, type PlayerCommand } from './game/actions';
import {
  clearProgress,
  loadProgress,
  loadRecords,
  recordRunResult,
  recordRunStart,
  saveProgress,
  saveRecords,
  updateRecordsFromState,
} from './game/save';
import type { GameResult, GameState, Records } from './game/types';
import TitleScreen from './components/TitleScreen';
import GameScreen from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import HelpModal from './components/HelpModal';
import RecordsScreen from './components/RecordsScreen';

type Screen = 'title' | 'game' | 'records' | 'help' | 'result';

export default function App() {
  const initialProgress = useMemo(() => loadProgress(), []);
  const [screen, setScreen] = useState<Screen>('title');
  const [gameState, setGameState] = useState<GameState | null>(initialProgress);
  const [records, setRecords] = useState<Records>(() => loadRecords());
  const [lastResult, setLastResult] = useState<GameResult | null>(initialProgress?.result ?? null);
  const [hasSave, setHasSave] = useState(Boolean(initialProgress));

  const persistRecords = (nextRecords: Records) => {
    setRecords(nextRecords);
    saveRecords(nextRecords);
  };

  const startNewGame = () => {
    const nextRecords = recordRunStart(records);
    persistRecords(nextRecords);
    const nextGame = createNewGame(Date.now());
    setGameState(nextGame);
    saveProgress(nextGame);
    setHasSave(true);
    setLastResult(null);
    setScreen('game');
  };

  const continueGame = () => {
    const progress = loadProgress();
    if (!progress) {
      setHasSave(false);
      return;
    }
    setGameState(progress);
    setLastResult(null);
    setScreen('game');
  };

  const commitGameState = (nextGame: GameState) => {
    setGameState(nextGame);
    const discovered = updateRecordsFromState(records, nextGame);

    if (nextGame.status === 'playing') {
      saveProgress(nextGame);
      persistRecords(discovered);
      setHasSave(true);
      return;
    }

    clearProgress();
    setHasSave(false);
    if (nextGame.result) {
      const completed = recordRunResult(discovered, nextGame.result);
      persistRecords(completed);
      setLastResult(nextGame.result);
    }
    setScreen('result');
  };

  const handleCommand = (command: PlayerCommand) => {
    if (!gameState) return;
    commitGameState(performPlayerAction(gameState, command));
  };

  const backToTitle = () => {
    setScreen('title');
  };

  return (
    <main className="app-shell">
      {screen === 'title' && (
        <TitleScreen
          hasSave={hasSave}
          records={records}
          onNewGame={startNewGame}
          onContinue={continueGame}
          onHelp={() => setScreen('help')}
          onRecords={() => setScreen('records')}
        />
      )}
      {screen === 'game' && gameState && (
        <GameScreen
          state={gameState}
          onCommand={handleCommand}
          onBackToTitle={backToTitle}
        />
      )}
      {screen === 'records' && <RecordsScreen records={records} onBack={backToTitle} />}
      {screen === 'help' && <HelpModal standalone onClose={backToTitle} />}
      {screen === 'result' && lastResult && (
        <ResultScreen result={lastResult} onRetry={startNewGame} onTitle={backToTitle} />
      )}
    </main>
  );
}
