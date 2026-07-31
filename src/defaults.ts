import type { AppConfig, ModalityId } from './types';

export const modalityLabels: Record<ModalityId, string> = {
  position: 'Spatial',
  audio: 'Auditory',
  colour: 'Colour',
  shape: 'Shape',
  number: 'Number',
};

export const DEFAULT_CONFIG: AppConfig = {
  name: 'Dual 2-back',
  trials: 30,
  seed: '',
  countdownSeconds: 3,
  stimulusMs: 500,
  blankMs: 1500,
  responseWindowMs: 1950,
  showTrialCounter: true,
  showProgress: true,
  allowLateResponse: true,
  grid: {
    rows: 3,
    columns: 3,
    excludeCentre: true,
    showGuides: true,
    cueScale: 0.66,
  },
  audio: {
    mode: 'speech',
    speechRate: 1,
    volume: 0.85,
    tokens: ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'],
    tones: [261.63, 293.66, 329.63, 392, 440, 493.88, 523.25, 587.33],
  },
  colour: {
    tokens: ['#00cc66', '#ffaa00', '#6012b9', '#0000ff', '#eaff00', '#abc88b'],
  },
  shape: {
    tokens: ['circle', 'square', 'triangle', 'diamond', 'cross', 'ring'],
  },
  number: {
    tokens: ['1', '2', '3', '4', '5', '6', '7', '8'],
  },
  adaptive: {
    enabled: false,
    increaseAt: 0.9,
    decreaseBelow: 0.7,
    minN: 1,
    maxN: 9,
  },
  modalities: {
    position: {
      enabled: true,
      n: 2,
      targetProbability: 0.3,
      lureMinusProbability: 0.08,
      lurePlusProbability: 0.08,
      responseKey: 'a',
    },
    audio: {
      enabled: true,
      n: 2,
      targetProbability: 0.3,
      lureMinusProbability: 0.08,
      lurePlusProbability: 0.08,
      responseKey: 'l',
    },
    colour: {
      enabled: false,
      n: 2,
      targetProbability: 0.3,
      lureMinusProbability: 0.08,
      lurePlusProbability: 0.08,
      responseKey: 's',
    },
    shape: {
      enabled: false,
      n: 2,
      targetProbability: 0.3,
      lureMinusProbability: 0.08,
      lurePlusProbability: 0.08,
      responseKey: 'd',
    },
    number: {
      enabled: false,
      n: 2,
      targetProbability: 0.3,
      lureMinusProbability: 0.08,
      lurePlusProbability: 0.08,
      responseKey: 'f',
    },
  },
};

export function cloneConfig(config: AppConfig): AppConfig {
  return structuredClone(config);
}

export const BUILT_IN_PRESETS: Array<{ name: string; description: string; config: AppConfig }> = [
  {
    name: 'Spatial 2-back',
    description: 'A clean single-modality spatial session.',
    config: (() => {
      const c = cloneConfig(DEFAULT_CONFIG);
      c.name = 'Spatial 2-back';
      c.modalities.audio.enabled = false;
      return c;
    })(),
  },
  {
    name: 'Dual 2-back',
    description: 'Spatial position and spoken letters at 2-back.',
    config: cloneConfig(DEFAULT_CONFIG),
  },
  {
    name: 'Dual 3-back',
    description: 'Spatial and auditory streams, both at 3-back.',
    config: (() => {
      const c = cloneConfig(DEFAULT_CONFIG);
      c.name = 'Dual 3-back';
      c.modalities.position.n = 3;
      c.modalities.audio.n = 3;
      c.trials = 36;
      return c;
    })(),
  },
  {
    name: 'Adaptive dual',
    description: 'Dual 2-back that proposes a higher or lower n after each session.',
    config: (() => {
      const c = cloneConfig(DEFAULT_CONFIG);
      c.name = 'Adaptive dual';
      c.adaptive.enabled = true;
      c.trials = 36;
      return c;
    })(),
  },
  {
    name: 'Mixed laboratory',
    description: 'Spatial 3-back + audio 2-back + colour 2-back.',
    config: (() => {
      const c = cloneConfig(DEFAULT_CONFIG);
      c.name = 'Mixed laboratory';
      c.modalities.position.n = 3;
      c.modalities.audio.n = 2;
      c.modalities.colour.enabled = true;
      c.modalities.colour.n = 2;
      c.trials = 42;
      return c;
    })(),
  },
];
