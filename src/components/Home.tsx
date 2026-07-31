import { BUILT_IN_PRESETS, cloneConfig, modalityLabels } from '../defaults';
import type { AppConfig, ModalityId } from '../types';

const ids: ModalityId[] = ['position', 'audio', 'colour', 'shape', 'number'];

export function Home({ config, setConfig, onStart, onConfigure }: {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  onStart: () => void;
  onConfigure: () => void;
}) {
  const enabled = ids.filter((id) => config.modalities[id].enabled);
  return (
    <main className="page home-page">
      <section className="hero">
        <p className="eyebrow">working-memory task</p>
        <h2>{config.name || 'Custom n-back'}</h2>
        <p className="hero-summary">
          {enabled.map((id) => `${modalityLabels[id]} ${config.modalities[id].n}-back`).join(' · ')}
        </p>
        <div className="hero-stats">
          <span><strong>{config.trials}</strong> trials</span>
          <span><strong>{config.stimulusMs + config.blankMs}</strong> ms / trial</span>
          <span><strong>{enabled.length}</strong> stream{enabled.length === 1 ? '' : 's'}</span>
        </div>
        <button className="primary-action hero-start" onClick={onStart}>start →</button>
        <button className="text-button" onClick={onConfigure}>advanced configuration</button>
      </section>

      <section className="quick-presets">
        <h3>quick starts</h3>
        <div className="quick-list">
          {BUILT_IN_PRESETS.slice(0, 4).map((preset) => (
            <button key={preset.name} onClick={() => setConfig(cloneConfig(preset.config))} className={config.name === preset.config.name ? 'selected' : ''}>
              <strong>{preset.name}</strong><span>{preset.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="about-tool">
        <h3>about this version</h3>
        <p>Run spatial, auditory, colour, shape and number streams independently or together. Each stream can use a different n-level, response key, target probability and lure probability. Sequences can be seeded for reproducibility.</p>
        <p>Results include hits, misses, false alarms, correct rejections, sensitivity, specificity, reaction times and d′. Session history and custom presets stay in your browser.</p>
      </section>
    </main>
  );
}
