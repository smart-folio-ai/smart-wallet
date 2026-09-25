import type {CSSProperties} from 'react';

/** CTA dos cards de plano — handoff da landing, seção Planos · Pricing. */
export function planCtaStyle(featured: boolean): CSSProperties {
  return {
    marginTop: 22.4,
    height: 38,
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...(featured
      ? {
          border: '1px solid var(--color-accent)',
          background: 'rgba(152,160,171,0.14)',
          color: 'var(--color-accent-100)',
        }
      : {border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-200)'}),
  };
}
