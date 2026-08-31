import {useState} from 'react';

interface KpiTooltip {
  title: string;
  body: string;
  formula?: string;
  side?: string;
}

export interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaStyle?: React.CSSProperties;
  sub?: string;
  tooltip?: KpiTooltip;
}

export function KpiCard({label, value, delta, deltaStyle, sub, tooltip}: KpiCardProps) {
  const [tipOpen, setTipOpen] = useState(false);
  return (
    <div style={{border: '1px solid var(--hair)', borderRadius: 8, padding: '14px 16.8px', background: 'var(--nk-card)', position: 'relative'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 5.6}}>
        <span style={{fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-600)'}}>
          {label}
        </span>
        {tooltip && (
          <button
            type="button"
            onMouseEnter={() => setTipOpen(true)}
            onMouseLeave={() => setTipOpen(false)}
            onFocus={() => setTipOpen(true)}
            onBlur={() => setTipOpen(false)}
            onClick={() => setTipOpen((v) => !v)}
            aria-label="O que é isso?"
            style={{width: 15, height: 15, flexShrink: 0, borderRadius: 4, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'help', display: 'grid', placeItems: 'center', padding: 0}}
          >
            <i className="ph-fill ph-info" style={{fontSize: 10}} />
          </button>
        )}
      </div>
      {tooltip && tipOpen && (
        <div style={{position: 'absolute', top: 34, left: tooltip.side === 'right' ? 'auto' : 0, right: tooltip.side === 'right' ? 0 : 'auto', zIndex: 60, width: 292, maxWidth: 'calc(100vw - 300px)', border: '1px solid rgba(145,132,217,0.35)', borderRadius: 8, background: 'var(--surf-4)', boxShadow: 'var(--shadow-lg)', padding: '11.2px 14px'}}>
          <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--color-neutral-100)'}}>{tooltip.title}</div>
          <div style={{fontSize: 12, color: 'var(--color-neutral-400)', lineHeight: 1.55, marginTop: 5.6}}>{tooltip.body}</div>
          {tooltip.formula && (
            <div style={{fontSize: 11, color: 'var(--color-accent-300)', marginTop: 8.4, paddingTop: 8.4, borderTop: '1px solid var(--hair-soft)', lineHeight: 1.45}}>
              {tooltip.formula}
            </div>
          )}
        </div>
      )}
      <div style={{fontFamily: 'var(--font-heading)', fontSize: 23, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 8.4, fontVariantNumeric: 'tabular-nums'}}>
        {value}
      </div>
      {(delta || sub) && (
        <div style={{display: 'flex', alignItems: 'center', gap: 5.6, marginTop: 5.6, fontSize: 11.5}}>
          {delta && <span style={deltaStyle}>{delta}</span>}
          {sub && <span style={{color: 'var(--color-neutral-600)'}}>{sub}</span>}
        </div>
      )}
    </div>
  );
}
