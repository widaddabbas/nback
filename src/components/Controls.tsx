import type { ReactNode } from 'react';

export function NumberField({ label, value, min, max, step = 1, onChange, suffix, help }: {
  label: string; value: number; min: number; max: number; step?: number; suffix?: string; help?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field-row">
      <span><strong>{label}</strong>{help ? <small>{help}</small> : null}</span>
      <span className="field-value">
        <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
        {suffix ? <em>{suffix}</em> : null}
      </span>
    </label>
  );
}

export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (value: boolean) => void; help?: string; }) {
  return (
    <label className="field-row toggle-row">
      <span><strong>{label}</strong>{help ? <small>{help}</small> : null}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function Section({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <section className="config-section">
      <div className="section-heading"><h2>{title}</h2>{note ? <p>{note}</p> : null}</div>
      <div className="section-body">{children}</div>
    </section>
  );
}
