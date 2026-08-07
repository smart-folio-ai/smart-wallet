import type {HTMLAttributes, ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Card padrão da landing. Elevação vem de hairline + gradiente interno,
 * nunca de sombra colorida — sombra colorida em fundo escuro lê como plástico.
 */
export function GlassPanel({className, children, ...rest}: GlassPanelProps) {
  return (
    <div
      {...rest}
      className={cn(
        'rounded-2xl border border-surface-hairline/[0.08]',
        'bg-gradient-to-b from-surface-hairline/[0.05] to-surface-hairline/[0.01]',
        'backdrop-blur-xl',
        className,
      )}>
      {children}
    </div>
  );
}

export default GlassPanel;
