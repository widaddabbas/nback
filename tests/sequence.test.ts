import { describe, expect, it } from 'vitest';
import { cloneConfig, DEFAULT_CONFIG } from '../src/defaults';
import { generateTrials } from '../src/engine/sequence';

function spatialOnly() {
  const c = cloneConfig(DEFAULT_CONFIG);
  Object.values(c.modalities).forEach((m) => { m.enabled = false; });
  c.modalities.position.enabled = true;
  c.modalities.position.n = 2;
  c.seed = 'test-seed';
  c.trials = 20;
  return c;
}

describe('sequence generation', () => {
  it('is reproducible with a seed', () => {
    const c = spatialOnly();
    expect(generateTrials(c)).toEqual(generateTrials(c));
  });

  it('makes every eligible trial a target at probability 1', () => {
    const c = spatialOnly();
    c.modalities.position.targetProbability = 1;
    c.modalities.position.lureMinusProbability = 0;
    c.modalities.position.lurePlusProbability = 0;
    const trials = generateTrials(c);
    expect(trials.slice(0, 2).every((t) => !t.stimuli.position?.isTarget)).toBe(true);
    expect(trials.slice(2).every((t) => t.stimuli.position?.isTarget)).toBe(true);
    for (let i = 2; i < trials.length; i += 1) {
      expect(trials[i].stimuli.position?.value).toBe(trials[i - 2].stimuli.position?.value);
    }
  });

  it('avoids accidental n-back targets when target probability is zero', () => {
    const c = spatialOnly();
    c.modalities.position.targetProbability = 0;
    c.modalities.position.lureMinusProbability = 0;
    c.modalities.position.lurePlusProbability = 0;
    const trials = generateTrials(c);
    for (let i = 2; i < trials.length; i += 1) {
      expect(trials[i].stimuli.position?.value).not.toBe(trials[i - 2].stimuli.position?.value);
      expect(trials[i].stimuli.position?.isTarget).toBe(false);
    }
  });
});
