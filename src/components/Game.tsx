import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { modalityLabels } from '../defaults';
import { playAudioStimulus, prepareAudio } from '../engine/audio';
import { generateTrials } from '../engine/sequence';
import type { AppConfig, ModalityId, Trial, TrialResponse } from '../types';

const modalityIds: ModalityId[] = ['position', 'audio', 'colour', 'shape', 'number'];

function Shape({ name }: { name: string }) {
  if (name === 'triangle') return <span className="shape shape-triangle" aria-label="triangle" />;
  if (name === 'diamond') return <span className="shape shape-diamond" aria-label="diamond" />;
  if (name === 'cross') return <span className="shape shape-cross" aria-label="cross">+</span>;
  if (name === 'ring') return <span className="shape shape-ring" aria-label="ring" />;
  if (name === 'square' || name === 'circle') return <span className={`shape shape-${name}`} aria-label={name} />;
  return <span className="shape-custom" aria-label={name}>{name}</span>;
}

function SpatialGrid({ config, position, visible }: { config: AppConfig; position?: number; visible: boolean }) {
  const cells = config.grid.rows * config.grid.columns;
  return (
    <div
      className={`spatial-grid ${config.grid.showGuides ? 'with-guides' : ''}`}
      style={{
        gridTemplateColumns: `repeat(${config.grid.columns}, 1fr)`,
        gridTemplateRows: `repeat(${config.grid.rows}, 1fr)`,
      }}
      aria-label="Spatial n-back grid"
    >
      {Array.from({ length: cells }, (_, i) => (
        <div className="grid-cell" key={i}>
          {visible && position === i ? <span className="spatial-cue" style={{ width: `${config.grid.cueScale * 100}%`, height: `${config.grid.cueScale * 100}%` }} /> : null}
        </div>
      ))}
    </div>
  );
}

export function Game({ config, onComplete, onAbort }: {
  config: AppConfig;
  onComplete: (trials: Trial[], responses: TrialResponse[], startedAt: string) => void;
  onAbort: () => void;
}) {
  const trials = useMemo(() => generateTrials(config), [config]);
  const enabled = useMemo(() => modalityIds.filter((id) => config.modalities[id].enabled), [config]);
  const [phase, setPhase] = useState<'instructions' | 'countdown' | 'playing' | 'paused'>(
    config.showInstructions ? 'instructions' : 'countdown',
  );
  const [countdown, setCountdown] = useState(config.countdownSeconds);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [responded, setResponded] = useState<Set<ModalityId>>(new Set());
  const responsesRef = useRef<TrialResponse[]>([]);
  const trialStartRef = useRef(0);
  const startedAtRef = useRef(new Date().toISOString());
  const hideTimerRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (hideTimerRef.current != null) window.clearTimeout(hideTimerRef.current);
    if (nextTimerRef.current != null) window.clearTimeout(nextTimerRef.current);
    hideTimerRef.current = null;
    nextTimerRef.current = null;
  };

  useEffect(() => {
    if (phase !== 'countdown') return;
    prepareAudio();
    if (config.countdownSeconds <= 0) {
      setPhase('playing');
      return;
    }
    setCountdown(config.countdownSeconds);
    const timer = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setPhase('playing');
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, config.countdownSeconds]);

  useEffect(() => {
    if (phase !== 'playing') return;
    clearTimers();
    const trial = trials[currentIndex];
    if (!trial) return;

    setVisible(true);
    setResponded(new Set());
    trialStartRef.current = performance.now();

    const audio = trial.stimuli.audio;
    if (audio) playAudioStimulus(audio.value, config);

    hideTimerRef.current = window.setTimeout(() => setVisible(false), config.stimulusMs);
    nextTimerRef.current = window.setTimeout(() => {
      if (currentIndex >= trials.length - 1) {
        setVisible(false);
        onComplete(trials, responsesRef.current, startedAtRef.current);
      } else {
        setCurrentIndex((value) => value + 1);
      }
    }, config.stimulusMs + config.blankMs);

    return clearTimers;
  }, [phase, currentIndex, trials, config, onComplete]);

  const respond = useCallback((modality: ModalityId) => {
    if (phase !== 'playing') return;
    if (!config.modalities[modality].enabled) return;
    if (responded.has(modality)) return;
    const elapsed = performance.now() - trialStartRef.current;
    const trialDuration = config.stimulusMs + config.blankMs;
    const allowedWindow = Math.min(
      config.responseWindowMs,
      config.allowLateResponse ? trialDuration : config.stimulusMs,
    );
    if (elapsed > allowedWindow) return;

    const trial = trials[currentIndex];
    const stimulus = trial?.stimuli[modality];
    if (!stimulus) return;

    const record: TrialResponse = {
      trialIndex: currentIndex,
      modality,
      responded: true,
      responseMs: Math.round(elapsed),
      isTarget: stimulus.isTarget,
      accepted: true,
    };
    responsesRef.current = [...responsesRef.current, record];
    setResponded((previous) => new Set(previous).add(modality));
  }, [phase, config, responded, trials, currentIndex]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      const modality = enabled.find((id) => config.modalities[id].responseKey.toLowerCase() === key);
      if (modality) {
        event.preventDefault();
        respond(modality);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setPhase((p) => (p === 'playing' ? 'paused' : p === 'paused' ? 'playing' : p));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [config, enabled, respond]);

  const pause = () => {
    if (phase !== 'playing' && phase !== 'paused') return;
    if (phase === 'playing') {
      clearTimers();
      setVisible(false);
      setPhase('paused');
    } else {
      // Resuming restarts the current trial from its beginning. This is explicit to
      // avoid silently shifting timing in the middle of a cognitive trial.
      responsesRef.current = responsesRef.current.filter((r) => r.trialIndex !== currentIndex);
      setResponded(new Set());
      setPhase('playing');
    }
  };

  if (phase === 'instructions') {
    const hasLures = enabled.some(
      (id) => config.modalities[id].lureMinusProbability > 0 || config.modalities[id].lurePlusProbability > 0,
    );
    return (
      <main className="game-page instructions-page">
        <div className="page-intro">
          <p className="eyebrow">before you start</p>
          <h2>How this session works</h2>
          <p>A new stimulus appears every {((config.stimulusMs + config.blankMs) / 1000).toFixed(1)}s. For each stream, press its key only when the current stimulus is identical to the one shown exactly n trials earlier in that same stream.</p>
        </div>
        <ul className="instructions-list">
          {enabled.map((id) => (
            <li key={id}>
              <strong>{modalityLabels[id]}</strong> — press <kbd>{config.modalities[id].responseKey.toUpperCase()}</kbd> when it matches {config.modalities[id].n}-back.
            </li>
          ))}
        </ul>
        {hasLures ? (
          <p className="instructions-note">Some non-matching trials are deliberately close — matching what appeared one trial earlier or later than n-back. These are not matches: only respond to an exact n-back repeat.</p>
        ) : null}
        <p className="instructions-note">
          {config.allowLateResponse
            ? 'You can respond any time after a stimulus appears, including briefly after it disappears, up to the configured response window.'
            : 'Respond while the stimulus is visible — responses after it disappears are ignored.'}
        </p>
        <div className="inline-actions">
          <button className="primary-action" onClick={() => setPhase('countdown')}>begin →</button>
          <button className="text-button" onClick={onAbort}>back</button>
        </div>
      </main>
    );
  }

  if (phase === 'countdown') {
    return (
      <main className="game-page game-centre">
        <p className="eyebrow">beginning</p>
        <div className="countdown" aria-live="polite">{countdown || 'go'}</div>
        <p>Use {enabled.map((id) => `${config.modalities[id].responseKey.toUpperCase()} for ${modalityLabels[id].toLowerCase()}`).join(' · ')}</p>
      </main>
    );
  }

  if (phase === 'paused') {
    return (
      <main className="game-page game-centre">
        <p className="eyebrow">paused</p>
        <h2>Session paused</h2>
        <p>The current trial will restart when you continue.</p>
        <div className="inline-actions"><button className="primary-action" onClick={pause}>continue →</button><button className="text-button danger" onClick={onAbort}>end session</button></div>
      </main>
    );
  }

  const current = trials[currentIndex];
  const position = current.stimuli.position?.value;
  const colour = current.stimuli.colour?.value;
  const shape = current.stimuli.shape?.value;
  const number = current.stimuli.number?.value;

  return (
    <main className="game-page">
      <div className="game-meta">
        <div>{config.showTrialCounter ? <span>{currentIndex + 1} / {trials.length}</span> : <span>&nbsp;</span>}</div>
        <button className="tiny-link" onClick={pause}>pause <kbd>esc</kbd></button>
      </div>
      {config.showProgress ? <div className="progress-track"><span style={{ width: `${((currentIndex + 1) / trials.length) * 100}%` }} /></div> : null}

      <div className={`stimulus-stage ${!visible ? 'blank' : ''} ${!config.modalities.position.enabled ? 'no-spatial' : ''}`}>
        {config.modalities.position.enabled ? <SpatialGrid config={config} position={typeof position === 'number' ? position : undefined} visible={visible} /> : null}
        <div className="aux-stimuli">
          {config.modalities.colour.enabled ? <div className="aux-slot"><span className="colour-cue" style={{ background: visible ? String(colour) : 'transparent' }} /></div> : null}
          {config.modalities.shape.enabled ? <div className="aux-slot">{visible && shape ? <Shape name={String(shape)} /> : null}</div> : null}
          {config.modalities.number.enabled ? <div className="aux-slot number-cue">{visible ? String(number ?? '') : ''}</div> : null}
        </div>
        {config.modalities.audio.enabled ? <div className="audio-indicator" aria-hidden="true">audio</div> : null}
      </div>

      <div className="response-strip" aria-label="Response buttons">
        {enabled.map((id) => (
          <button
            key={id}
            className={`response-button ${responded.has(id) ? 'pressed' : ''}`}
            onClick={() => respond(id)}
            disabled={responded.has(id)}
          >
            <span>{modalityLabels[id]}</span><kbd>{config.modalities[id].responseKey.toUpperCase()}</kbd>
          </button>
        ))}
      </div>
    </main>
  );
}
