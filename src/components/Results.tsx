import { modalityLabels } from '../defaults';
import { adaptiveNextConfig } from '../engine/adaptive';
import type { AppConfig, SessionResult } from '../types';
import { exportSessionJson } from '../utils/export';

const pct = (x: number) => `${Math.round(x * 100)}%`;
const ms = (x: number | null) => x == null ? '—' : `${Math.round(x)} ms`;

export function Results({ result, onAgain, onAdaptive, onHistory, onConfigure }: {
  result: SessionResult;
  onAgain: () => void;
  onAdaptive: (config: AppConfig) => void;
  onHistory: () => void;
  onConfigure: () => void;
}) {
  const next = adaptiveNextConfig(result.config, result.modalityStats);
  const hasAdaptiveChange = result.config.adaptive.enabled && result.modalityStats.some((s) => next.modalities[s.modality].n !== s.n);

  return (
    <main className="page results-page">
      <div className="page-intro">
        <p className="eyebrow">session complete</p>
        <h2>{result.config.name}</h2>
        <p>Overall classification accuracy <strong>{pct(result.overallAccuracy)}</strong>.</p>
      </div>

      <div className="result-grid">
        {result.modalityStats.map((s) => (
          <article className="result-panel" key={s.modality}>
            <div className="result-title"><h3>{modalityLabels[s.modality]}</h3><span>{s.n}-back</span></div>
            <dl>
              <div><dt>accuracy</dt><dd>{pct(s.accuracy)}</dd></div>
              <div><dt>d′</dt><dd>{s.dPrime.toFixed(2)}</dd></div>
              <div><dt>hits</dt><dd>{s.hits}/{s.targets}</dd></div>
              <div><dt>misses</dt><dd>{s.misses}</dd></div>
              <div><dt>false alarms</dt><dd>{s.falseAlarms}</dd></div>
              <div><dt>correct rejections</dt><dd>{s.correctRejections}</dd></div>
              <div><dt>sensitivity</dt><dd>{pct(s.sensitivity)}</dd></div>
              <div><dt>specificity</dt><dd>{pct(s.specificity)}</dd></div>
              <div><dt>median hit RT</dt><dd>{ms(s.medianRt)}</dd></div>
              <div><dt>mean hit RT</dt><dd>{ms(s.meanRt)}</dd></div>
            </dl>
          </article>
        ))}
      </div>

      {result.config.adaptive.enabled ? <section className="adaptive-result">
        <h3>adaptive suggestion</h3>
        <p>{hasAdaptiveChange ? 'The next session changes n according to your configured thresholds.' : 'Your n-levels stay unchanged at the configured thresholds.'}</p>
        <div className="adaptive-levels">{result.modalityStats.map((s) => <span key={s.modality}>{modalityLabels[s.modality]}: {s.n} → {next.modalities[s.modality].n}</span>)}</div>
        <button className="primary-action" onClick={() => onAdaptive(next)}>start adaptive next →</button>
      </section> : null}

      <div className="result-actions">
        <button className="primary-action" onClick={onAgain}>repeat this configuration →</button>
        <button className="text-button" onClick={onConfigure}>change settings</button>
        <button className="text-button" onClick={onHistory}>view history</button>
        <button className="text-button" onClick={() => exportSessionJson(result)}>export session JSON</button>
      </div>
      <p className="method-note">d′ uses a log-linear correction: (hits + 0.5)/(targets + 1) and (false alarms + 0.5)/(non-targets + 1), preventing infinite scores at perfect rates.</p>
    </main>
  );
}
