import type {CSSProperties, ReactNode} from 'react';

/**
 * Peças visuais compartilhadas pelos cards da tela Configurações, copiadas do
 * bloco `isSettings` de design_handoff_trackerr/Trackerr App.dc.html.
 */

export {badgeStyle, type BadgeSeverity} from '@/components/shared/badge-style';

export const CARD_STYLE: CSSProperties = {
  border: '1px solid var(--hair)',
  borderRadius: 8,
  background: 'var(--nk-card)',
};

export const INPUT_STYLE: CSSProperties = {
  height: 34,
  padding: '0 11.2px',
  border: '1px solid var(--hair)',
  borderRadius: 8,
  background: 'rgba(var(--rgb-bg),0.6)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  fontVariantNumeric: 'tabular-nums',
  width: '100%',
  boxSizing: 'border-box',
};

const BUTTON_BASE: CSSProperties = {
  height: 34,
  padding: '0 14px',
  borderRadius: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  cursor: 'pointer',
};

export const PRIMARY_BUTTON_STYLE: CSSProperties = {
  ...BUTTON_BASE,
  border: 'none',
  background: 'var(--grad-violet)',
  color: 'var(--sunk)',
  fontWeight: 600,
};
export const PRIMARY_BUTTON_CLASS =
  'hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-60';

// Cor e borda ficam na classe (e não no style) para o hover conseguir sobrescrever.
export const OUTLINE_BUTTON_STYLE: CSSProperties = {
  ...BUTTON_BASE,
  borderWidth: 1,
  borderStyle: 'solid',
  background: 'transparent',
};
export const OUTLINE_BUTTON_CLASS =
  'border-[color:var(--hair)] text-[color:var(--color-neutral-300)] hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)] disabled:cursor-not-allowed disabled:opacity-60';

export const ACCENT_SMALL_BUTTON_STYLE: CSSProperties = {
  height: 30,
  padding: '0 11.2px',
  borderRadius: 8,
  border: '1px solid var(--color-accent-700)',
  color: 'var(--color-accent-200)',
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5.6,
  textDecoration: 'none',
};
export const ACCENT_SMALL_BUTTON_CLASS =
  'bg-transparent hover:bg-[rgba(152,160,171,0.12)] disabled:cursor-not-allowed disabled:opacity-60';

interface CardHeaderProps {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function SettingsCardHeader({title, subtitle, action}: CardHeaderProps) {
  return (
    <div
      style={{
        padding: '14px 16.8px',
        borderBottom: '1px solid var(--hair-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 11.2,
      }}>
      <div>
        <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0}}>
          {title}
        </h2>
        {subtitle ? (
          <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2}}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {action}
    </div>
  );
}
