import {GlassPanel} from '../ui/GlassPanel';
import {portfolioMockupData} from '../landing-data';

const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n);

const percent = (n: number) => `${n.toFixed(1).replace('.', ',')}%`;

/** Recorte da tela de carteira: total consolidado e as maiores posições. */
export function PortfolioMockup() {
  const {total, positions} = portfolioMockupData;

  return (
    <GlassPanel className="p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs text-on-surface-muted/50">
            Patrimônio consolidado
          </p>
          <p className="mt-1 font-heading text-3xl font-bold tabular-nums text-on-surface">
            {currency(total)}
          </p>
        </div>
        <span className="rounded-full border border-surface-hairline/[0.08] px-3 py-1 text-xs text-on-surface-muted/50">
          4 corretoras
        </span>
      </div>

      <ul className="mt-7 space-y-4">
        {positions.map((position) => (
          <li key={position.symbol}>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-heading text-sm font-semibold text-on-surface">
                  {position.symbol}
                </p>
                <p className="truncate text-xs text-on-surface-muted/45">
                  {position.name}
                </p>
              </div>
              <div className="flex items-center gap-4 whitespace-nowrap">
                <span className="text-sm tabular-nums text-on-surface-muted/70">
                  {percent(position.weight)}
                </span>
                <span
                  className={`w-16 text-right text-sm tabular-nums ${
                    position.up ? 'text-positive' : 'text-negative'
                  }`}>
                  {position.change}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-hairline/[0.06]">
              <div
                className="h-full rounded-full bg-brand/70"
                style={{width: `${position.weight * 3}%`}}
              />
            </div>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}

export default PortfolioMockup;
