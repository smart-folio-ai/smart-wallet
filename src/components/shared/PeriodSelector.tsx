export interface PeriodOption {
  label: string;
  value: string;
}

export interface PeriodSelectorProps {
  periods: PeriodOption[];
  value: string;
  onChange: (v: string) => void;
}

export function PeriodSelector({periods, value, onChange}: PeriodSelectorProps) {
  return (
    <div style={{display: 'flex', padding: 2.8, gap: 2.8, border: '1px solid var(--hair)', borderRadius: 8}}>
      {periods.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          style={value === p.value
            ? {height: 28, padding: '0 10px', fontSize: 12, border: 'none', borderRadius: 6, background: 'var(--nk-card)', color: 'var(--color-neutral-100)', boxShadow: '0 1px 3px rgba(0,0,0,0.18)', cursor: 'pointer', fontFamily: 'var(--font-body)'}
            : {height: 28, padding: '0 10px', fontSize: 12, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'pointer', fontFamily: 'var(--font-body)'}}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
