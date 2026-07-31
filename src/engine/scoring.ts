import type { AppConfig, ModalityId, ModalityStats, Trial, TrialResponse } from '../types';

function mean(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[index];
}

// Acklam-style rational approximation, sufficient for behavioural summary statistics.
export function inverseNormalCdf(p: number): number {
  if (p <= 0 || p >= 1) throw new Error('p must be in (0, 1)');
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const plow = 0.02425;
  const phigh = 1 - plow;

  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function scoreModality(
  modality: ModalityId,
  config: AppConfig,
  trials: Trial[],
  responses: TrialResponse[],
): ModalityStats {
  const relevantTrials = trials.filter((trial) => trial.stimuli[modality]);
  const responseMap = new Map(
    responses.filter((r) => r.modality === modality).map((r) => [r.trialIndex, r]),
  );

  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;
  const rts: number[] = [];

  relevantTrials.forEach((trial) => {
    const stimulus = trial.stimuli[modality]!;
    const response = responseMap.get(trial.index);
    const responded = Boolean(response?.responded && response.accepted);

    if (stimulus.isTarget && responded) {
      hits += 1;
      if (response?.responseMs != null) rts.push(response.responseMs);
    } else if (stimulus.isTarget) {
      misses += 1;
    } else if (responded) {
      falseAlarms += 1;
    } else {
      correctRejections += 1;
    }
  });

  const targets = hits + misses;
  const nonTargets = falseAlarms + correctRejections;
  const total = targets + nonTargets;
  const precisionDenom = hits + falseAlarms;

  // Log-linear correction prevents infinite d′ for perfect hit/false-alarm rates.
  const correctedHitRate = (hits + 0.5) / (targets + 1);
  const correctedFaRate = (falseAlarms + 0.5) / (nonTargets + 1);
  const dPrime = inverseNormalCdf(correctedHitRate) - inverseNormalCdf(correctedFaRate);

  return {
    modality,
    n: config.modalities[modality].n,
    targets,
    nonTargets,
    hits,
    misses,
    falseAlarms,
    correctRejections,
    accuracy: total ? (hits + correctRejections) / total : 0,
    precision: precisionDenom ? hits / precisionDenom : 0,
    sensitivity: targets ? hits / targets : 0,
    specificity: nonTargets ? correctRejections / nonTargets : 0,
    dPrime,
    meanRt: mean(rts),
    medianRt: percentile(rts, 0.5),
    p90Rt: percentile(rts, 0.9),
  };
}

export function scoreSession(config: AppConfig, trials: Trial[], responses: TrialResponse[]): ModalityStats[] {
  return (Object.keys(config.modalities) as ModalityId[])
    .filter((id) => config.modalities[id].enabled)
    .map((id) => scoreModality(id, config, trials, responses));
}
