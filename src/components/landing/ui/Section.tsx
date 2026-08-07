import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface SectionProps {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}

/**
 * Wrapper padrão das seções da landing: ritmo vertical e largura máxima
 * consistentes. Toda seção passa por aqui para o espaçamento não divergir.
 */
export function Section({
  id,
  className,
  containerClassName,
  children,
}: SectionProps) {
  return (
    <section id={id} className={cn('relative py-24 sm:py-32', className)}>
      <div
        className={cn(
          'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
          containerClassName,
        )}>
        {children}
      </div>
    </section>
  );
}

export default Section;
