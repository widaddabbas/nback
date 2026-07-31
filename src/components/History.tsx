import { useMemo, useState } from 'react';
import { modalityLabels } from '../defaults';
import { clearHistory, loadHistory } from '../storage/local';
import type { ModalityId, SessionResult } from '../types';
import { exportHistoryCsv, exportHistoryJson } from '../utils/export';

const ids: ModalityId[] = ['position', 'audio', 'colour', 'shape', 'number'];

function MiniChart({ history, modality }: { history: SessionResult[]; modality: ModalityId }) {
  const points = history
    .slice()
    .reverse()
    .map((s, index) => ({ index, stat: s.modalityStats.find((x) => x.modality === modality) }))
    .filter((x): x is { index: number; stat: NonNullable<typeof x.stat> } => Boolean(x.stat));
  if (points.length < 2) return <p className="empty-note">Complete at least two {modalityLabels[modality].toLowerCase()} sessions to draw a trend.</p>;
  const width = 620, height = 150, pad = 16;
  const maxN = Math.max(...points.map((p) => p.stat.n), 2);
  const x = (i: number) => pad + (i / Math.max(1, points.length - 1)) * (width - pad * 2);
  const y = (n: number) => height - pad - ((n - 1) / Math.max(1, maxN - 1)) * (height - pad * 2);
  const path = points.map((p, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(p.stat.n)}`).join(' ');
  return (
    <svg className="history-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${modalityLabels[modality]} n-level over sessions`}>
      <path d={path} fill="none" vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.stat.n)} r="4"><title>session {i + 1}: {p.stat.n}-back</title></circle>)}
    </svg>
  );
}

export function History() {
  const [history, setHistory] = useState(loadHistory());
  const usedModalities = useMemo(() => ids.filter((id) => history.some((s) => s.modalityStats.some((x) => x.modality === id))), [history]);
  const [chartModality, setChartModality] = useState<ModalityId>(usedModalities[0] ?? 'position');

  const doClear = () => {
    if (!window.confirm('Delete all locally stored n-back session history?')) return;
    clearHistory();
    setHistory([]);
  };

  return (
    <main className="page history-page">
      <div className="page-intro">
        <p className="eyebrow">local history</p>
        <h2>{history.length ? `${history.length} session${history.length === 1 ? '' : 's'}` : 'No sessions yet'}</h2>
        <p>History is stored only in this browser. Nothing is uploaded anywhere.</p>
      </div>

      {history.length ? <>
        <section className="history-trend">
          <div className="trend-head"><h3>n-level trend</h3><select value={chartModality} onChange={(e) => setChartModality(e.target.value as ModalityId)}>{usedModalities.map((id) => <option key={id} value={id}>{modalityLabels[id]}</option>)}</select></div>
          <MiniChart history={history} modality={chartModality} />
        </section>

        <div className="history-table-wrap">
          <table className="history-table">
            <thead><tr><th>date</th><th>session</th><th>stream</th><th>n</th><th>accuracy</th><th>d′</th><th>median RT</th></tr></thead>
            <tbody>{history.flatMap((session) => session.modalityStats.map((s, index) => (
              <tr key={`${session.id}-${s.modality}`}>
                <td>{index === 0 ? new Date(session.completedAt).toLocaleDateString() : ''}</td>
                <td>{index === 0 ? session.config.name : ''}</td>
                <td>{modalityLabels[s.modality]}</td>
                <td>{s.n}</td>
                <td>{Math.round(s.accuracy * 100)}%</td>
                <td>{s.dPrime.toFixed(2)}</td>
                <td>{s.medianRt == null ? '—' : `${Math.round(s.medianRt)} ms`}</td>
              </tr>
            )))}</tbody>
          </table>
        </div>

        <div className="history-actions"><button className="text-button" onClick={() => exportHistoryCsv(history)}>export summary CSV</button><button className="text-button" onClick={() => exportHistoryJson(history)}>export full JSON</button><button className="text-button danger" onClick={doClear}>clear history</button></div>
      </> : <p className="empty-state">Complete a session and its results will appear here.</p>}
    </main>
  );
}
