import type {CSSProperties, ReactNode} from 'react';

const HEADING: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  color: 'var(--color-text)',
};

export interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  /** Linha abaixo do preço (ex.: equivalente mensal no anual). */
  priceNote?: string;
  detail?: string;
  features: string[];
  featured?: boolean;
  badge?: string;
  children?: ReactNode;
}

/** Card de plano do handoff da landing (Trackerr Landing.dc.html · Planos). */
export function PlanCard({name, price, period, priceNote, detail, features, featured = false, badge, children}: PlanCardProps) {
  return (
    <div
      data-testid="plan-card"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: 8,
        padding: 22.4,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--nk-card)',
        ...(featured
          ? {
              border: '1px solid rgba(152,160,171,0.45)',
              boxShadow: '0 0 0 1px rgba(152,160,171,0.12), 0 20px 48px rgba(0,0,0,0.45)',
            }
          : {border: '1px solid var(--hair)'}),
      }}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8.4}}>
        <div style={{...HEADING, fontSize: 15}}>{name}</div>
        {badge && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-accent-200)',
              border: '1px solid rgba(152,160,171,0.45)',
              borderRadius: 6,
              padding: '2px 6px',
            }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 5.6, marginTop: 14}}>
        <span style={{...HEADING, fontSize: 28, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums'}}>{price}</span>
        <span style={{fontSize: 12, color: 'var(--color-neutral-600)'}}>{period}</span>
      </div>
      {priceNote && (
        <div style={{fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 4, fontVariantNumeric: 'tabular-nums'}}>{priceNote}</div>
      )}
      <div style={{fontSize: 12.5, color: 'var(--color-neutral-500)', marginTop: 8.4, lineHeight: 1.5, minHeight: 38}}>{detail}</div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8.4,
          marginTop: 16.8,
          paddingTop: 16.8,
          borderTop: '1px solid var(--hair-soft)',
        }}>
        {features.map((feature) => (
          <div key={feature} style={{display: 'flex', gap: 8.4, fontSize: 12.5, color: 'var(--color-neutral-300)', lineHeight: 1.45}}>
            <i className="ph ph-check" style={{fontSize: 13, color: 'var(--color-accent-300)', marginTop: 2}} aria-hidden />
            <span>{feature}</span>
          </div>
        ))}
      </div>
      <div style={{marginTop: 'auto', display: 'flex', flexDirection: 'column'}}>{children}</div>
    </div>
  );
}
