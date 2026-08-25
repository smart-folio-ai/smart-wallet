import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';
import {SeverityBadge} from '@/components/ui/severity-badge';

/**
 * Lista única de prioridade — substitui o padrão de dois cards
 * redundantes ("Trackerr IA Hoje" + "Próximas ações recomendadas") por
 * uma lista ordenada ALTA→BAIXA. Itens além do que o plano libera
 * continuam gated pelo `PremiumBlur` existente (não duplica a lógica de
 * bloqueio); envolva os itens extras nele, do jeito que o dashboard já
 * faz hoje.
 */
export function PriorityFeed({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'divide-y divide-surface-hairline/[0.08] overflow-hidden rounded-2xl border border-surface-hairline/[0.1] bg-surface-panel/40',
        className
      )}>
      {children}
    </div>
  );
}

interface PriorityFeedItemProps {
  severity: 'alta' | 'media' | 'baixa';
  title: string;
  description: string;
  /** Onde o insight nasceu (ex.: "Otimizador Fiscal", "Radar Anti-Erro"). Ajuda a rastrear a fusão de fontes numa lista só. */
  source?: string;
  className?: string;
}

export function PriorityFeedItem({
  severity,
  title,
  description,
  source,
  className,
}: PriorityFeedItemProps) {
  return (
    <div className={cn('flex items-start gap-3 p-4', className)}>
      <SeverityBadge severity={severity} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-on-surface-muted">
          {description}
        </p>
        {source && (
          <p className="mt-1.5 text-xs text-on-surface-subtle">
            origem: {source}
          </p>
        )}
      </div>
    </div>
  );
}

export default PriorityFeed;
