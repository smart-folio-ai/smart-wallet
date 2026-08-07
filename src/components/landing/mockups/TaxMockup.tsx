import {GlassPanel} from '../ui/GlassPanel';
import {taxMockupData} from '../landing-data';

const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(n);

/** Recorte da tela fiscal: apuração do mês até a DARF. */
export function TaxMockup() {
  const {month, sales, profit, offset, taxable, darf} = taxMockupData;

  const rows = [
    {label: 'Vendas no mês', value: currency(sales)},
    {label: 'Lucro apurado', value: currency(profit)},
    {label: 'Prejuízo compensado', value: `- ${currency(offset)}`},
    {label: 'Base tributável', value: currency(taxable)},
  ];

  return (
    <GlassPanel className="p-6">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold text-on-surface">
          Apuração de IR
        </p>
        <span className="rounded-full border border-surface-hairline/[0.08] px-3 py-1 text-xs text-on-surface-muted/50">
          {month}
        </span>
      </div>

      <dl className="mt-6 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-surface-hairline/[0.05] pb-3 last:border-b-0">
            <dt className="text-sm text-on-surface-muted/60">{row.label}</dt>
            <dd className="text-sm tabular-nums text-on-surface">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 rounded-xl border border-brand/25 bg-brand/10 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-on-surface-accent">
            DARF a pagar
          </p>
          <p className="font-heading text-xl font-bold tabular-nums text-on-surface">
            {currency(darf)}
          </p>
        </div>
        <p className="mt-2 text-xs text-on-surface-muted/50">
          Código 6015 · vencimento no último dia útil do mês seguinte
        </p>
      </div>
    </GlassPanel>
  );
}

export default TaxMockup;
