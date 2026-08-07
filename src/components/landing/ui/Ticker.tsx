import {useRef} from 'react';
import {cn} from '@/lib/utils';
import {useCountUp} from '../motion/useCountUp';

interface TickerProps {
  value: number;
  /** Formatação do número. Padrão: inteiro com separador pt-BR. */
  format?: (n: number) => string;
  className?: string;
}

const defaultFormat = (n: number) =>
  new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 0}).format(n);

/**
 * Número que conta ao entrar na viewport. tabular-nums é obrigatório:
 * sem ele os dígitos têm larguras diferentes e a linha inteira treme.
 */
export function Ticker({value, format = defaultFormat, className}: TickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, value, format);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {format(value)}
    </span>
  );
}

export default Ticker;
