import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

interface MetricCellProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** Célula em estado de alerta (ex.: concentração acima do limite). */
  alert?: boolean;
  /** Cor do valor: positivo/negativo além do alerta padrão. */
  tone?: 'default' | 'positive' | 'negative' | 'warning';
  className?: string;
}

const TONE_CLASS: Record<NonNullable<MetricCellProps['tone']>, string> = {
  default: 'text-on-surface',
  positive: 'text-accent-positive',
  negative: 'text-accent-negative',
  warning: 'text-warning',
};

/**
 * Célula fixa de KPI — o "painel de instrumentos" do redesign de
 * dashboard: uso em grade com `MetricCellGrid`, nunca sozinha fora dela,
 * porque a identidade visual (posição fixa, sem reflow) é o ponto.
 */
export function MetricCell({
  label,
  value,
  sub,
  alert = false,
  tone = 'default',
  className,
}: MetricCellProps) {
  return (
    <div
      className={cn(
        'bg-surface-raised p-5',
        alert && 'bg-warning/[0.06]',
        className
      )}>
      <p className="text-xs text-on-surface-subtle">{label}</p>
      <p
        className={cn(
          'mt-1.5 font-heading text-2xl font-extrabold tracking-tight tabular-nums',
          TONE_CLASS[alert ? 'warning' : tone]
        )}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-on-surface-subtle">{sub}</p>}
    </div>
  );
}

/** Grade 1px com fundo hairline entre as células — mesma técnica que os cards glass. */
export function MetricCellGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-surface-hairline/[0.1] bg-surface-hairline/[0.08] md:grid-cols-4',
        className
      )}>
      {children}
    </div>
  );
}

export default MetricCell;
