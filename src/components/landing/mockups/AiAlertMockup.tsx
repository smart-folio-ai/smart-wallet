import {AlertTriangle, Info, TrendingUp} from '@/components/ui/icons';
import {GlassPanel} from '../ui/GlassPanel';
import {aiAlertMockupData} from '../landing-data';

const severityStyles = {
  alta: {
    icon: AlertTriangle,
    chip: 'border-negative/25 bg-negative/10 text-negative',
  },
  média: {
    icon: TrendingUp,
    chip: 'border-brand/25 bg-brand/10 text-on-surface-accent',
  },
  baixa: {
    icon: Info,
    chip: 'border-surface-hairline/[0.1] bg-surface-hairline/[0.04] text-on-surface-muted/60',
  },
} as const;

/** Recorte da tela de alertas: o que a IA colocou no topo da fila. */
export function AiAlertMockup() {
  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold text-on-surface">
          O que exige atenção
        </p>
        <span className="text-xs text-on-surface-muted/45">
          Atualizado há 2 min
        </span>
      </div>

      <ul className="mt-6 space-y-3">
        {aiAlertMockupData.map((alert) => {
          const style = severityStyles[alert.severity];
          const Icon = style.icon;

          return (
            <li
              key={alert.title}
              className="rounded-xl border border-surface-hairline/[0.07] bg-surface-hairline/[0.02] p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${style.chip}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-sm font-semibold text-on-surface">
                      {alert.title}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${style.chip}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-on-surface-muted/60">
                    {alert.detail}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassPanel>
  );
}

export default AiAlertMockup;
