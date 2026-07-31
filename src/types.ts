export type ModalityId = 'position' | 'audio' | 'colour' | 'shape' | 'number';

export type AudioMode = 'speech' | 'tones';

export interface ModalityConfig {
  enabled: boolean;
  n: number;
  targetProbability: number;
  lureMinusProbability: number;
  lurePlusProbability: number;
  responseKey: string;
}

export interface AppConfig {
  name: string;
  trials: number;
  seed: string;
  countdownSeconds: number;
  stimulusMs: number;
  blankMs: number;
  responseWindowMs: number;
  showTrialCounter: boolean;
  showProgress: boolean;
  allowLateResponse: boolean;
  grid: {
    rows: number;
    columns: number;
    excludeCentre: boolean;
    showGuides: boolean;
    cueScale: number;
  };
  audio: {
    mode: AudioMode;
    speechRate: number;
    volume: number;
    tokens: string[];
    tones: number[];
  };
  colour: {
    tokens: string[];
  };
  shape: {
    tokens: string[];
  };
  number: {
    tokens: string[];
  };
  adaptive: {
    enabled: boolean;
    increaseAt: number;
    decreaseBelow: number;
    minN: number;
    maxN: number;
  };
  modalities: Record<ModalityId, ModalityConfig>;
}

export type StimulusValue = string | number;

export interface TrialStimulus {
  value: StimulusValue;
  isTarget: boolean;
  lure: 'minus' | 'plus' | null;
}

export interface Trial {
  index: number;
  stimuli: Partial<Record<ModalityId, TrialStimulus>>;
}

export interface TrialResponse {
  trialIndex: number;
  modality: ModalityId;
  responded: boolean;
  responseMs: number | null;
  isTarget: boolean;
  accepted: boolean;
}

export interface ModalityStats {
  modality: ModalityId;
  n: number;
  targets: number;
  nonTargets: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  accuracy: number;
  precision: number;
  sensitivity: number;
  specificity: number;
  dPrime: number;
  meanRt: number | null;
  medianRt: number | null;
  p90Rt: number | null;
}

export interface SessionResult {
  id: string;
  startedAt: string;
  completedAt: string;
  config: AppConfig;
  trials: Trial[];
  modalityStats: ModalityStats[];
  overallAccuracy: number;
  responses: TrialResponse[];
}

export interface SavedPreset {
  id: string;
  name: string;
  config: AppConfig;
  createdAt: string;
}
