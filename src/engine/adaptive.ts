import type { AppConfig, ModalityStats } from '../types';
import { cloneConfig } from '../defaults';

export function adaptiveNextConfig(config: AppConfig, stats: ModalityStats[]): AppConfig {
  const next = cloneConfig(config);
  if (!config.adaptive.enabled) return next;

  stats.forEach((stat) => {
    const current = next.modalities[stat.modality].n;
    if (stat.accuracy >= config.adaptive.increaseAt) {
      next.modalities[stat.modality].n = Math.min(config.adaptive.maxN, current + 1);
    } else if (stat.accuracy < config.adaptive.decreaseBelow) {
      next.modalities[stat.modality].n = Math.max(config.adaptive.minN, current - 1);
    }
  });
  next.seed = '';
  next.name = `Adaptive ${stats.map((s) => `${s.modality} ${next.modalities[s.modality].n}`).join(' + ')}`;
  return next;
}
