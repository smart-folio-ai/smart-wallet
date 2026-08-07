import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface EyebrowProps {
  className?: string;
  children: ReactNode;
}

/** Label curto acima do título da seção. */
export function Eyebrow({className, children}: EyebrowProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-surface-hairline/10',
        'bg-surface-hairline/[0.04] px-3.5 py-1.5',
        'text-xs font-medium uppercase tracking-[0.14em] text-on-surface-muted/70',
        className,
      )}>
      {children}
    </span>
  );
}

export default Eyebrow;
