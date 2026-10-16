import type { AppConfig, ModalityConfig, ModalityId, StimulusValue, Trial, TrialStimulus } from '../types';
import { randomChoice, seededRandom, type RandomFn } from './random';

function buildPositionPool(config: AppConfig): number[] {
  const total = config.grid.rows * config.grid.columns;
  const all = Array.from({ length: total }, (_, i) => i);
  if (!config.grid.excludeCentre) return all;
  if (config.grid.rows % 2 === 0 || config.grid.columns % 2 === 0) return all;
  const centre = Math.floor(config.grid.rows / 2) * config.grid.columns + Math.floor(config.grid.columns / 2);
  return all.filter((value) => value !== centre);
}

function poolFor(modality: ModalityId, config: AppConfig): StimulusValue[] {
  switch (modality) {
    case 'position': return buildPositionPool(config);
    case 'audio': return config.audio.mode === 'tones' ? config.audio.tones : config.audio.tokens;
    case 'colour': return config.colour.tokens;
    case 'shape': return config.shape.tokens;
    case 'number': return config.number.tokens;
  }
}

function chooseNonTarget(pool: StimulusValue[], forbidden: StimulusValue | undefined, random: RandomFn) {
  const choices = forbidden === undefined ? pool : pool.filter((item) => item !== forbidden);
  return randomChoice(choices.length ? choices : pool, random);
}

function generateModalitySequence(
  count: number,
  modalityConfig: ModalityConfig,
  pool: StimulusValue[],
  random: RandomFn,
): TrialStimulus[] {
  const out: TrialStimulus[] = [];
  const n = modalityConfig.n;

  for (let i = 0; i < count; i += 1) {
    const targetValue = i >= n ? out[i - n].value : undefined;
    const canTarget = targetValue !== undefined;
    const roll = random();

    if (canTarget && roll < modalityConfig.targetProbability) {
      out.push({ value: targetValue, isTarget: true, lure: null });
      continue;
    }

    const minusIndex = i - (n - 1);
    const plusIndex = i - (n + 1);
    const minusValue = n > 1 && minusIndex >= 0 ? out[minusIndex]?.value : undefined;
    const plusValue = plusIndex >= 0 ? out[plusIndex]?.value : undefined;
    const minusEligible = minusValue !== undefined && minusValue !== targetValue;
    const plusEligible = plusValue !== undefined && plusValue !== targetValue;
    const lureRoll = random();

    if (minusEligible && lureRoll < modalityConfig.lureMinusProbability) {
      out.push({ value: minusValue, isTarget: false, lure: 'minus' });
      continue;
    }

    // When the minus-lure slot isn't eligible, its probability share isn't reserved,
    // so the plus-lure check must not inherit that unused width.
    const plusThreshold = minusEligible
      ? modalityConfig.lureMinusProbability + modalityConfig.lurePlusProbability
      : modalityConfig.lurePlusProbability;

    if (plusEligible && lureRoll < plusThreshold) {
      out.push({ value: plusValue, isTarget: false, lure: 'plus' });
      continue;
    }

    out.push({ value: chooseNonTarget(pool, targetValue, random), isTarget: false, lure: null });
  }

  return out;
}

export function generateTrials(config: AppConfig): Trial[] {
  const random = seededRandom(config.seed);
  const modalities = (Object.keys(config.modalities) as ModalityId[]).filter(
    (id) => config.modalities[id].enabled,
  );

  if (!modalities.length) throw new Error('Enable at least one modality.');

  const sequences = new Map<ModalityId, TrialStimulus[]>();
  modalities.forEach((id) => {
    const pool = poolFor(id, config);
    if (pool.length < 2) throw new Error(`${id} requires at least two possible stimuli.`);
    sequences.set(id, generateModalitySequence(config.trials, config.modalities[id], pool, random));
  });

  return Array.from({ length: config.trials }, (_, index) => ({
    index,
    stimuli: Object.fromEntries(
      modalities.map((id) => [id, sequences.get(id)![index]]),
    ) as Partial<Record<ModalityId, TrialStimulus>>,
  }));
}
