import useAppToast from '@/hooks/use-app-toast';
import {badgeStyle} from '@/components/shared/badge-style';
import {
  buildBuckets,
  buildHistoryRows,
  type CalcTone,
  type FiscalMonth,
} from '@/services/fiscal/fiscal-summary';

const toneColor: Record<CalcTone, string> = {
  neutral: 'var(--color-neutral-100)',
  positive: 'var(--pos)',
  negative: 'var(--neg)',
  total: 'var(--warn)',
};

const COLUMNS: {label: string; align: 'left' | 'right'}[] = [
  {label: 'Mês', align: 'left'},
  {label: 'Vendas', align: 'right'},
  {label: 'Resultado', align: 'right'},
  {label: 'Prejuízo acumulado', align: 'right'},
  {label: 'DARF', align: 'right'},
  {label: 'Status', align: 'right'},
];

const cell = {padding: '9.8px 16.8px', textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums'};

/**
 * Buckets, histórico de DARFs e exportação para o IR aparecem borrados com o
 * aviso "em breve", como no handoff. Por baixo já vão os números reais do ano.
 */
export function FiscalRoadmapSection({month, monthly, year}: {month: FiscalMonth | null; monthly: FiscalMonth[]; year?: number}) {
  const toast = useAppToast();
  const buckets = month ? buildBuckets(month) : [];
  const rows = buildHistoryRows(monthly);

  return (
    <div style={{position: 'relative'}} data-testid="fiscal-roadmap">
      <div aria-hidden style={{filter: 'blur(6px)', opacity: 0.5, pointerEvents: 'none', userSelect: 'none', minHeight: 360, maxHeight: 520, overflow: 'hidden'}}>
        <div className="grid grid-cols-1 gap-[16.8px] md:grid-cols-3">
          {buckets.map((bucket) => (
            <section key={bucket.title} style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', padding: 16.8}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8.4}}>
                <div style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600}}>{bucket.title}</div>
                <span style={badgeStyle(bucket.severity)}>{bucket.status}</span>
              </div>
              <div style={{fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 5.6, lineHeight: 1.5}}>{bucket.sub}</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 8.4, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--hair-soft)'}}>
                {bucket.rows.map((row) => (
                  <div key={row.label} style={{display: 'flex', gap: 11.2, fontSize: 12}}>
                    <span style={{flex: 1, color: 'var(--color-neutral-400)'}}>{row.label}</span>
                    <span style={{fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: toneColor[row.tone]}}>{row.value}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', marginTop: buckets.length ? 16.8 : 0}}>
          <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div>
              <div style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600}}>Histórico de DARFs e prejuízo acumulado</div>
              <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2}}>
                {year ? `Exercício ${year} · valores em reais` : 'Valores em reais'}
              </div>
            </div>
            <span style={{height: 30, padding: '0 11.2px', borderRadius: 8, border: '1px solid var(--color-accent-700)', color: 'var(--color-accent-200)', fontSize: 11.5, display: 'inline-flex', alignItems: 'center'}}>
              Exportar para o IR
            </span>
          </div>
          <div style={{overflowX: 'auto'}}>
            <table style={{width: '100%', minWidth: 700, borderCollapse: 'collapse', fontSize: 12.5}}>
              <thead>
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.label}
                      style={{padding: '8.4px 16.8px', textAlign: column.align, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', background: 'rgba(var(--rgb-bg),0.5)'}}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} style={{borderTop: '1px solid var(--hair-soft)'}}>
                    <td style={{padding: '9.8px 16.8px', color: 'var(--color-neutral-300)'}}>{row.month}</td>
                    <td style={{...cell, color: 'var(--color-neutral-300)'}}>{row.sales}</td>
                    <td style={cell}>
                      <span style={{fontWeight: 600, color: row.resultPositive ? 'var(--pos)' : 'var(--neg)'}}>{row.result}</span>
                    </td>
                    <td style={{...cell, color: 'var(--color-neutral-400)'}}>{row.carry}</td>
                    <td style={{...cell, fontWeight: 600}}>{row.darf}</td>
                    <td style={{padding: '9.8px 16.8px', textAlign: 'right'}}>
                      <span style={badgeStyle(row.severity)}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          background: 'linear-gradient(to bottom, rgba(var(--rgb-bg),0) 0%, rgba(var(--rgb-bg),0.55) 22%, rgba(var(--rgb-bg),0.94) 55%)',
        }}>
        <div style={{maxWidth: 420, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, border: '1px solid var(--color-accent-700)', borderRadius: 8, background: 'var(--surf-4)', boxShadow: 'var(--shadow-lg)', padding: '28px 32px'}}>
          <div style={{width: 52, height: 52, borderRadius: 8, background: 'var(--grad-violet)', display: 'grid', placeItems: 'center'}}>
            <i className="ph-fill ph-receipt" style={{fontSize: 24, color: 'var(--sunk)'}} aria-hidden />
          </div>
          <div>
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', margin: 0}}>
              Apuração automática de IR — em breve
            </h2>
            <div style={{fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 8.4, lineHeight: 1.55}}>
              Classificação por buckets, histórico completo de DARFs e exportação para o IR estão em desenvolvimento.
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast.success('Anotado', 'A apuração automática vai aparecer nesta tela assim que for lançada.')}
            className="hover:bg-[rgba(152,160,171,0.12)]"
            style={{height: 34, padding: '0 16.8px', borderRadius: 8, border: '1px solid var(--color-accent)', background: 'transparent', color: 'var(--color-accent-200)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer'}}>
            Avise-me quando lançar
          </button>
        </div>
      </div>
    </div>
  );
}
