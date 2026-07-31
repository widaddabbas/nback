import type { AppConfig, SessionResult } from '../types';

export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportConfig(config: AppConfig): void {
  downloadText('nback-preset.json', JSON.stringify(config, null, 2), 'application/json');
}

export function exportSessionJson(session: SessionResult): void {
  downloadText(`nback-session-${session.completedAt.slice(0, 10)}.json`, JSON.stringify(session, null, 2), 'application/json');
}

export function exportHistoryJson(history: SessionResult[]): void {
  downloadText('nback-history.json', JSON.stringify(history, null, 2), 'application/json');
}

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportHistoryCsv(history: SessionResult[]): void {
  const rows = [['session_id','date','preset','modality','n','accuracy','d_prime','hits','misses','false_alarms','correct_rejections','mean_rt_ms','median_rt_ms']];
  history.forEach((session) => session.modalityStats.forEach((s) => {
    rows.push([
      session.id,
      session.completedAt,
      session.config.name,
      s.modality,
      String(s.n),
      s.accuracy.toFixed(4),
      s.dPrime.toFixed(4),
      String(s.hits),
      String(s.misses),
      String(s.falseAlarms),
      String(s.correctRejections),
      s.meanRt?.toFixed(1) ?? '',
      s.medianRt?.toFixed(1) ?? '',
    ]);
  }));
  downloadText('nback-history.csv', rows.map((r) => r.map(csvEscape).join(',')).join('\n'), 'text/csv');
}
