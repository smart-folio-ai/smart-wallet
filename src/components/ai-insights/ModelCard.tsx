import {SectionHeader} from '@/components/shared';
import {CARD_STYLE} from './insights.styles';

export interface ModelCardRow {
  label: string;
  value: string;
}

interface ModelCardProps {
  rows: ModelCardRow[];
}

export function ModelCard({rows}: ModelCardProps) {
  return (
    <section style={CARD_STYLE}>
      <SectionHeader title="Ficha do modelo" subtitle="Rastreabilidade exigida por auditoria" />
      <div style={{padding: '5.6px 0'}}>
        {rows.map((row) => (
          <div key={row.label} style={{display: 'flex', gap: 11.2, padding: '7px 16.8px', fontSize: 11.5}}>
            <span style={{width: 106, flexShrink: 0, color: 'var(--color-neutral-600)'}}>{row.label}</span>
            <span style={{color: 'var(--color-neutral-300)', fontVariantNumeric: 'tabular-nums', minWidth: 0, overflowWrap: 'anywhere'}}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: '11.2px 16.8px',
          borderTop: '1px solid var(--hair-soft)',
          fontSize: 11,
          color: 'var(--color-neutral-600)',
          lineHeight: 1.5,
        }}>
        O Trackerr não recomenda ativos. Os insights comparam sua carteira à política que você definiu.
      </div>
    </section>
  );
}
