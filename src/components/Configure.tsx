import { useRef, useState } from 'react';
import { BUILT_IN_PRESETS, cloneConfig, modalityLabels } from '../defaults';
import { deletePreset, loadPresets, savePreset } from '../storage/local';
import type { AppConfig, ModalityId, SavedPreset } from '../types';
import { exportConfig } from '../utils/export';
import { NumberField, Section, Toggle } from './Controls';

const modalityIds: ModalityId[] = ['position', 'audio', 'colour', 'shape', 'number'];

function clampProbability(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function Configure({ config, setConfig, onStart }: {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  onStart: () => void;
}) {
  const [saved, setSaved] = useState<SavedPreset[]>(loadPresets());
  const fileRef = useRef<HTMLInputElement>(null);

  const mutate = (fn: (next: AppConfig) => void) => {
    const next = cloneConfig(config);
    fn(next);
    setConfig(next);
  };

  const updateModality = (id: ModalityId, key: keyof AppConfig['modalities'][ModalityId], value: number | string | boolean) => {
    mutate((next) => {
      (next.modalities[id] as unknown as Record<string, number | string | boolean>)[key] = value;
    });
  };

  const saveCurrent = () => {
    const name = window.prompt('Preset name', config.name)?.trim();
    if (!name) return;
    const preset: SavedPreset = {
      id: crypto.randomUUID(),
      name,
      config: { ...cloneConfig(config), name },
      createdAt: new Date().toISOString(),
    };
    savePreset(preset);
    setSaved(loadPresets());
  };

  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as AppConfig;
      if (!parsed.modalities || !parsed.grid || !parsed.audio) throw new Error('Not an n-back configuration.');
      setConfig(parsed);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not import preset.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const enabled = modalityIds.filter((id) => config.modalities[id].enabled);

  return (
    <main className="page configure-page">
      <div className="page-intro">
        <p className="eyebrow">custom game</p>
        <h2>Configure the experiment</h2>
        <p>Each stimulus stream can have its own n, target rate, lure rate and response key.</p>
      </div>

      <Section title="presets" note="Start from a simple setup, then change anything.">
        <div className="preset-grid">
          {BUILT_IN_PRESETS.map((preset) => (
            <button key={preset.name} className="preset-button" onClick={() => setConfig(cloneConfig(preset.config))}>
              <strong>{preset.name}</strong><span>{preset.description}</span>
            </button>
          ))}
          {saved.map((preset) => (
            <div className="saved-preset" key={preset.id}>
              <button className="preset-button" onClick={() => setConfig(cloneConfig(preset.config))}>
                <strong>{preset.name}</strong><span>saved locally</span>
              </button>
              <button className="tiny-link danger" onClick={() => { deletePreset(preset.id); setSaved(loadPresets()); }}>delete</button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="session">
        <label className="field-row"><span><strong>Name</strong><small>Saved into history with this session.</small></span><input type="text" value={config.name} onChange={(e) => mutate((n) => { n.name = e.target.value; })} /></label>
        <NumberField label="Trials" value={config.trials} min={5} max={500} onChange={(v) => mutate((n) => { n.trials = Math.round(v); })} />
        <NumberField label="Countdown" value={config.countdownSeconds} min={0} max={10} suffix="s" onChange={(v) => mutate((n) => { n.countdownSeconds = Math.round(v); })} />
        <label className="field-row"><span><strong>Random seed</strong><small>Leave blank for a new sequence each session. Reuse a seed to reproduce one.</small></span><input type="text" placeholder="random" value={config.seed} onChange={(e) => mutate((n) => { n.seed = e.target.value; })} /></label>
      </Section>

      <Section title="modalities" note={`${enabled.length} active`}>
        <div className="modality-list">
          {modalityIds.map((id) => {
            const m = config.modalities[id];
            return (
              <article className={`modality-panel ${m.enabled ? 'enabled' : ''}`} key={id}>
                <div className="modality-head">
                  <label><input type="checkbox" checked={m.enabled} onChange={(e) => updateModality(id, 'enabled', e.target.checked)} /><strong>{modalityLabels[id]}</strong></label>
                  <span>{m.n}-back</span>
                </div>
                {m.enabled ? <div className="modality-options">
                  <NumberField label="n" value={m.n} min={1} max={20} onChange={(v) => updateModality(id, 'n', Math.round(v))} />
                  <NumberField label="Targets" value={Math.round(m.targetProbability * 100)} min={0} max={80} suffix="%" onChange={(v) => updateModality(id, 'targetProbability', clampProbability(v / 100))} />
                  <NumberField label="n−1 lures" value={Math.round(m.lureMinusProbability * 100)} min={0} max={50} suffix="%" onChange={(v) => updateModality(id, 'lureMinusProbability', clampProbability(v / 100))} />
                  <NumberField label="n+1 lures" value={Math.round(m.lurePlusProbability * 100)} min={0} max={50} suffix="%" onChange={(v) => updateModality(id, 'lurePlusProbability', clampProbability(v / 100))} />
                  <label className="field-row"><span><strong>Response key</strong></span><input className="key-input" maxLength={1} value={m.responseKey} onChange={(e) => updateModality(id, 'responseKey', e.target.value.slice(-1).toLowerCase())} /></label>
                </div> : null}
              </article>
            );
          })}
        </div>
      </Section>

      <Section title="timing">
        <NumberField label="Stimulus visible" value={config.stimulusMs} min={50} max={10000} step={50} suffix="ms" onChange={(v) => mutate((n) => { n.stimulusMs = v; })} />
        <NumberField label="Blank interval" value={config.blankMs} min={0} max={15000} step={50} suffix="ms" onChange={(v) => mutate((n) => { n.blankMs = v; })} />
        <NumberField label="Response window" value={config.responseWindowMs} min={50} max={25000} step={50} suffix="ms" help="Responses after this point are ignored." onChange={(v) => mutate((n) => { n.responseWindowMs = v; })} />
        <Toggle label="Accept responses after stimulus disappears" checked={config.allowLateResponse} onChange={(v) => mutate((n) => { n.allowLateResponse = v; })} />
      </Section>

      <Section title="spatial display">
        <NumberField label="Rows" value={config.grid.rows} min={2} max={8} onChange={(v) => mutate((n) => { n.grid.rows = Math.round(v); })} />
        <NumberField label="Columns" value={config.grid.columns} min={2} max={8} onChange={(v) => mutate((n) => { n.grid.columns = Math.round(v); })} />
        <Toggle label="Exclude centre" checked={config.grid.excludeCentre} help="Applies when both dimensions are odd." onChange={(v) => mutate((n) => { n.grid.excludeCentre = v; })} />
        <Toggle label="Show faint grid guides" checked={config.grid.showGuides} onChange={(v) => mutate((n) => { n.grid.showGuides = v; })} />
        <NumberField label="Cue size" value={Math.round(config.grid.cueScale * 100)} min={25} max={95} suffix="%" onChange={(v) => mutate((n) => { n.grid.cueScale = v / 100; })} />
      </Section>

      <Section title="auditory stream">
        <label className="field-row"><span><strong>Audio type</strong></span><select value={config.audio.mode} onChange={(e) => mutate((n) => { n.audio.mode = e.target.value as AppConfig['audio']['mode']; })}><option value="speech">spoken tokens</option><option value="tones">tones</option></select></label>
        <label className="field-row"><span><strong>Spoken tokens</strong><small>Comma-separated. Useful for letters, words or syllables.</small></span><textarea rows={2} value={config.audio.tokens.join(', ')} onChange={(e) => mutate((n) => { n.audio.tokens = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); })} /></label>
        <NumberField label="Speech rate" value={config.audio.speechRate} min={0.5} max={2} step={0.05} onChange={(v) => mutate((n) => { n.audio.speechRate = v; })} />
        <NumberField label="Audio volume" value={Math.round(config.audio.volume * 100)} min={0} max={100} suffix="%" onChange={(v) => mutate((n) => { n.audio.volume = v / 100; })} />
        <label className="field-row"><span><strong>Tone frequencies</strong><small>Comma-separated Hz values.</small></span><textarea rows={2} value={config.audio.tones.join(', ')} onChange={(e) => mutate((n) => { n.audio.tones = e.target.value.split(',').map(Number).filter((x) => Number.isFinite(x) && x > 0); })} /></label>
      </Section>

      <Section title="visual stimulus sets">
        <label className="field-row"><span><strong>Colours</strong><small>CSS colours or hex codes, comma-separated.</small></span><textarea rows={2} value={config.colour.tokens.join(', ')} onChange={(e) => mutate((n) => { n.colour.tokens = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); })} /></label>
        <label className="field-row"><span><strong>Shapes</strong><small>Built-ins: circle, square, triangle, diamond, cross, ring. Other tokens display as text.</small></span><textarea rows={2} value={config.shape.tokens.join(', ')} onChange={(e) => mutate((n) => { n.shape.tokens = e.target.value.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean); })} /></label>
        <label className="field-row"><span><strong>Numbers / symbols</strong></span><textarea rows={2} value={config.number.tokens.join(', ')} onChange={(e) => mutate((n) => { n.number.tokens = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); })} /></label>
      </Section>

      <Section title="adaptation" note="Changes n only between completed sessions.">
        <Toggle label="Adaptive n" checked={config.adaptive.enabled} onChange={(v) => mutate((n) => { n.adaptive.enabled = v; })} />
        {config.adaptive.enabled ? <>
          <NumberField label="Increase n at accuracy" value={Math.round(config.adaptive.increaseAt * 100)} min={50} max={100} suffix="%" onChange={(v) => mutate((n) => { n.adaptive.increaseAt = v / 100; })} />
          <NumberField label="Decrease n below accuracy" value={Math.round(config.adaptive.decreaseBelow * 100)} min={0} max={95} suffix="%" onChange={(v) => mutate((n) => { n.adaptive.decreaseBelow = v / 100; })} />
          <NumberField label="Minimum n" value={config.adaptive.minN} min={1} max={20} onChange={(v) => mutate((n) => { n.adaptive.minN = Math.round(v); })} />
          <NumberField label="Maximum n" value={config.adaptive.maxN} min={1} max={20} onChange={(v) => mutate((n) => { n.adaptive.maxN = Math.round(v); })} />
        </> : null}
      </Section>

      <Section title="interface">
        <Toggle label="Show trial number" checked={config.showTrialCounter} onChange={(v) => mutate((n) => { n.showTrialCounter = v; })} />
        <Toggle label="Show progress bar" checked={config.showProgress} onChange={(v) => mutate((n) => { n.showProgress = v; })} />
      </Section>

      <div className="config-actions">
        <button className="text-button" onClick={saveCurrent}>save preset</button>
        <button className="text-button" onClick={() => exportConfig(config)}>export JSON</button>
        <button className="text-button" onClick={() => fileRef.current?.click()}>import JSON</button>
        <input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(e) => void importFile(e.target.files?.[0])} />
        <button className="primary-action" disabled={!enabled.length} onClick={onStart}>start session →</button>
      </div>
    </main>
  );
}
