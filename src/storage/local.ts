import type { AppConfig, SavedPreset, SessionResult } from '../types';

const HISTORY_KEY = 'widad-nback-history-v1';
const PRESETS_KEY = 'widad-nback-presets-v1';
const LAST_CONFIG_KEY = 'widad-nback-last-config-v1';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function loadHistory(): SessionResult[] {
  return loadJson<SessionResult[]>(HISTORY_KEY, []);
}

export function saveSession(result: SessionResult): void {
  const history = loadHistory();
  localStorage.setItem(HISTORY_KEY, JSON.stringify([result, ...history].slice(0, 500)));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function loadPresets(): SavedPreset[] {
  return loadJson<SavedPreset[]>(PRESETS_KEY, []);
}

export function savePreset(preset: SavedPreset): void {
  const presets = loadPresets().filter((p) => p.id !== preset.id);
  localStorage.setItem(PRESETS_KEY, JSON.stringify([preset, ...presets]));
}

export function deletePreset(id: string): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(loadPresets().filter((p) => p.id !== id)));
}

export function loadLastConfig(fallback: AppConfig): AppConfig {
  return loadJson<AppConfig>(LAST_CONFIG_KEY, fallback);
}

export function saveLastConfig(config: AppConfig): void {
  localStorage.setItem(LAST_CONFIG_KEY, JSON.stringify(config));
}
