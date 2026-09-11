import {useState} from 'react';

/**
 * Célula da barra quantitativa do dashboard (TRA-141).
 *
 * Segue o handoff (design_handoff_trackerr/README.md, "Tooltip de métrica"):
 * "toda métrica quantitativa tem ícone info (15×15, raio 4px, borda
 * `--color-accent-700`); o tooltip traz nome, definição em linguagem comum e a
 * fórmula com janela. Abre em hover, foco de teclado e clique."
 *
 * Mesma mecânica do `KpiCard`, que já implementava o padrão para os KPIs.
 */

export interface MetricTooltip {
  title: string;
  body: string;
  formula?: string;
  /** Abre para a esquerda quando a célula está na borda direita da grade. */
  side?: 'left' | 'right';
}

export interface QuantMetricCellProps {
  label: string;
  value: string;
  note?: string;
  tooltip?: MetricTooltip;
  /**
   * Posição na grade. A barra não usa `overflow: hidden` (cortaria a
   * tooltip), então as células das pontas arredondam os próprios cantos para
   * acompanhar o raio 8 do contêiner.
   */
  edge?: 'first' | 'last' | 'only';
}

/** Raio interno: 8px do contêiner menos a borda de 1px. */
const INNER_RADIUS = 7;

const edgeRadius = (edge: QuantMetricCellProps['edge']): React.CSSProperties => {
  switch (edge) {
    case 'first':
      return {borderTopLeftRadius: INNER_RADIUS, borderBottomLeftRadius: INNER_RADIUS};
    case 'last':
      return {borderTopRightRadius: INNER_RADIUS, borderBottomRightRadius: INNER_RADIUS};
    case 'only':
      return {borderRadius: INNER_RADIUS};
    default:
      return {};
  }
};

export function QuantMetricCell({label, value, note, tooltip, edge}: QuantMetricCellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        padding: '11.2px 16.8px',
        background: 'var(--surf-3)',
        position: 'relative',
        ...edgeRadius(edge),
      }}>
      <div style={{display: 'flex', alignItems: 'center', gap: 5.6}}>
        {/* Rótulo do handoff: 10,5 / 600 / 0,1em / uppercase. */}
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-neutral-600)',
          }}>
          {label}
        </span>
        {tooltip && (
          <button
            type="button"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onClick={() => setOpen((v) => !v)}
            aria-label={`O que é ${tooltip.title}?`}
            aria-expanded={open}
            style={{
              width: 15,
              height: 15,
              flexShrink: 0,
              borderRadius: 4,
              border: '1px solid var(--color-accent-700)',
              background: 'transparent',
              color: 'var(--color-neutral-500)',
              cursor: 'help',
              display: 'grid',
              placeItems: 'center',
              padding: 0,
            }}>
            {/* Regular, não fill: fill é reservado a IA e estado ativo. */}
            <i className="ph ph-info" style={{fontSize: 10}} />
          </button>
        )}
      </div>

      {tooltip && open && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            top: 34,
            left: tooltip.side === 'right' ? 'auto' : 0,
            right: tooltip.side === 'right' ? 0 : 'auto',
            zIndex: 60,
            width: 292,
            maxWidth: 'calc(100vw - 300px)',
            border: '1px solid rgba(152,160,171,0.35)',
            borderRadius: 8,
            background: 'var(--surf-4)',
            boxShadow: 'var(--shadow-lg)',
            padding: '11.2px 14px',
          }}>
          <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--color-neutral-100)'}}>
            {tooltip.title}
          </div>
          <div style={{fontSize: 12, color: 'var(--color-neutral-400)', lineHeight: 1.55, marginTop: 5.6}}>
            {tooltip.body}
          </div>
          {tooltip.formula && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-accent-300)',
                marginTop: 8.4,
                paddingTop: 8.4,
                borderTop: '1px solid var(--hair-soft)',
                lineHeight: 1.45,
              }}>
              {tooltip.formula}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginTop: 5.6,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--color-neutral-100)',
        }}>
        {value}
      </div>
      {note && (
        <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2.8}}>
          {note}
        </div>
      )}
    </div>
  );
}
