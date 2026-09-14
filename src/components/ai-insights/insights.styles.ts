import type React from 'react';

/**
 * Estilos da tela IA Insights, transcritos de
 * design_handoff_trackerr/Trackerr App.dc.html (bloco `isInsights`,
 * `segStyle` e `badgeStyle`).
 */

export {badgeStyle, type BadgeSeverity} from '@/components/shared/badge-style';

export const CARD_STYLE: React.CSSProperties = {
  border: '1px solid var(--hair)',
  borderRadius: 8,
  background: 'var(--nk-card)',
};

export function segStyle(active: boolean): React.CSSProperties {
  return {
    height: 24,
    padding: '0 10px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 11.5,
    fontWeight: 500,
    fontFamily: 'var(--font-body)',
    transition: 'all .15s ease',
    ...(active
      ? {
          background: 'rgba(152,160,171,0.20)',
          color: 'var(--color-accent-200)',
          boxShadow: 'inset 0 0 0 1px rgba(152,160,171,0.45)',
        }
      : {background: 'transparent', color: 'var(--color-neutral-500)'}),
  };
}

// Cor de borda e texto ficam nas classes (e não no `style`) porque o estilo
// inline venceria o `hover:` e o `style-hover` do handoff nunca apareceria.
export const GHOST_BUTTON_CLASS =
  'bg-transparent border-[color:var(--hair)] text-[color:var(--color-neutral-300)] hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)] disabled:cursor-not-allowed disabled:opacity-60';

export const ACCENT_BUTTON_CLASS =
  'bg-transparent hover:bg-[rgba(152,160,171,0.12)] disabled:cursor-not-allowed disabled:opacity-60';

export const SMALL_BUTTON_STYLE: React.CSSProperties = {
  height: 28,
  padding: '0 11.2px',
  borderRadius: 6,
  borderWidth: 1,
  borderStyle: 'solid',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  cursor: 'pointer',
};

export const ACCENT_SMALL_BUTTON_STYLE: React.CSSProperties = {
  ...SMALL_BUTTON_STYLE,
  borderColor: 'var(--color-accent-700)',
  color: 'var(--color-accent-200)',
  fontWeight: 500,
};

export const META_STYLE: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--color-neutral-600)',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

export const MUTED_TEXT_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-neutral-500)',
  lineHeight: 1.5,
};
