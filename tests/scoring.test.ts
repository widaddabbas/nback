import { describe, expect, it } from 'vitest';
import { cloneConfig, DEFAULT_CONFIG } from '../src/defaults';
import { scoreModality } from '../src/engine/scoring';
import type { Trial, TrialResponse } from '../src/types';

describe('scoring', () => {
  it('counts hits, misses, false alarms and correct rejections', () => {
    const config = cloneConfig(DEFAULT_CONFIG);
    const trials: Trial[] = [
      { index: 0, stimuli: { position: { value: 0, isTarget: false, lure: null } } },
      { index: 1, stimuli: { position: { value: 1, isTarget: true, lure: null } } },
      { index: 2, stimuli: { position: { value: 2, isTarget: true, lure: null } } },
      { index: 3, stimuli: { position: { value: 3, isTarget: false, lure: null } } },
    ];
    const responses: TrialResponse[] = [
      { trialIndex: 1, modality: 'position', responded: true, responseMs: 430, isTarget: true, accepted: true },
      { trialIndex: 3, modality: 'position', responded: true, responseMs: 510, isTarget: false, accepted: true },
    ];
    const s = scoreModality('position', config, trials, responses);
    expect(s.hits).toBe(1);
    expect(s.misses).toBe(1);
    expect(s.falseAlarms).toBe(1);
    expect(s.correctRejections).toBe(1);
    expect(s.accuracy).toBe(0.5);
    expect(Number.isFinite(s.dPrime)).toBe(true);
    expect(s.medianRt).toBe(430);
  });
});
