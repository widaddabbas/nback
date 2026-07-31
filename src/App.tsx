import { useCallback, useState } from 'react';
import { Configure } from './components/Configure';
import { Game } from './components/Game';
import { Header } from './components/Header';
import { History } from './components/History';
import { Home } from './components/Home';
import { Results } from './components/Results';
import { cloneConfig, DEFAULT_CONFIG } from './defaults';
import { scoreSession } from './engine/scoring';
import { loadLastConfig, saveLastConfig, saveSession } from './storage/local';
import type { AppConfig, SessionResult, Trial, TrialResponse } from './types';

type Screen = 'home' | 'configure' | 'game' | 'results' | 'history';

function validateConfig(config: AppConfig): string | null {
  const enabled = Object.values(config.modalities).filter((m) => m.enabled);
  if (!enabled.length) return 'Enable at least one modality.';
  if (enabled.some((m) => !m.responseKey.trim())) return 'Each enabled modality needs a response key.';
  const keys = enabled.map((m) => m.responseKey.toLowerCase());
  if (new Set(keys).size !== keys.length) return 'Enabled modalities need different response keys.';
  if (config.trials <= Math.max(...enabled.map((m) => m.n))) return 'Use more trials than the highest n-level.';
  if (config.stimulusMs <= 0 || config.blankMs < 0) return 'Timing values must be positive.';
  return null;
}

export default function App() {
  const [config, setConfigState] = useState<AppConfig>(() => loadLastConfig(cloneConfig(DEFAULT_CONFIG)));
  const [sessionConfig, setSessionConfig] = useState<AppConfig | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [result, setResult] = useState<SessionResult | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const setConfig = (next: AppConfig) => {
    setConfigState(next);
    saveLastConfig(next);
  };

  const beginWith = useCallback((source: AppConfig) => {
    const error = validateConfig(source);
    if (error) {
      window.alert(error);
      setScreen('configure');
      return;
    }
    const session = cloneConfig(source);
    if (!session.seed.trim()) session.seed = crypto.randomUUID();
    setSessionConfig(session);
    setGameKey((k) => k + 1);
    setScreen('game');
  }, []);

  const start = useCallback(() => beginWith(config), [beginWith, config]);

  const complete = useCallback((trials: Trial[], responses: TrialResponse[], startedAt: string) => {
    if (!sessionConfig) return;
    const modalityStats = scoreSession(sessionConfig, trials, responses);
    const overallAccuracy = modalityStats.length
      ? modalityStats.reduce((sum, s) => sum + s.accuracy, 0) / modalityStats.length
      : 0;
    const completed: SessionResult = {
      id: crypto.randomUUID(),
      startedAt,
      completedAt: new Date().toISOString(),
      config: cloneConfig(sessionConfig),
      trials,
      modalityStats,
      overallAccuracy,
      responses,
    };
    saveSession(completed);
    setResult(completed);
    setScreen('results');
  }, [sessionConfig]);

  if (screen === 'game' && sessionConfig) {
    return <div className="app"><Game key={gameKey} config={sessionConfig} onComplete={complete} onAbort={() => setScreen('home')} /></div>;
  }

  return (
    <div className="app">
      <Header screen={screen} onNavigate={setScreen} />
      {screen === 'home' ? <Home config={config} setConfig={setConfig} onStart={start} onConfigure={() => setScreen('configure')} /> : null}
      {screen === 'configure' ? <Configure config={config} setConfig={setConfig} onStart={start} /> : null}
      {screen === 'history' ? <History /> : null}
      {screen === 'results' && result ? <Results
        result={result}
        onAgain={start}
        onAdaptive={(next) => { setConfig(next); beginWith(next); }}
        onHistory={() => setScreen('history')}
        onConfigure={() => setScreen('configure')}
      /> : null}
      <footer className="site-footer"><span>N–Back</span><a href="https://github.com/widaddabbas">GitHub ↗</a><span>data stays local</span></footer>
    </div>
  );
}
