import type {CSSProperties} from 'react';

/** Selo de status do handoff (`badgeStyle` em Trackerr App.dc.html). */
export type BadgeSeverity = 'ok' | 'warn' | 'info' | 'neg';

const BADGE_TONE: Record<BadgeSeverity, CSSProperties> = {
  warn: {color: 'var(--warn)', borderColor: 'rgba(240,179,46,0.35)', background: 'rgba(240,179,46,0.10)'},
  info: {color: 'var(--color-accent-200)', borderColor: 'rgba(152,160,171,0.40)', background: 'rgba(152,160,171,0.12)'},
  ok: {color: 'var(--pos)', borderColor: 'rgba(47,214,163,0.32)', background: 'rgba(47,214,163,0.10)'},
  neg: {color: 'var(--neg)', borderColor: 'rgba(242,80,107,0.35)', background: 'rgba(242,80,107,0.10)'},
};

export function badgeStyle(severity: BadgeSeverity): CSSProperties {
  return {
    flexShrink: 0,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    ...BADGE_TONE[severity],
  };
}
