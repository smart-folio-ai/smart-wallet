import {Info, Clock} from '@/components/ui/icons';
import {Badge} from '@/components/ui/badge';
import {SectionHeader, DataTable, TD_STYLE, TD_RIGHT} from '@/components/shared';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {formatCurrency, formatPercentage} from '@/utils/formatters';
import {IndicatorItem as FundamentalIndicatorItem} from '@/components/asset/indicator-item';
import {readIndicator} from '@/pages/asset-fundamentals.utils';
import type {
  FundamentalKey,
  FinancialHistoryRow,
  CashflowSection,
} from '@/pages/asset-fundamentals.utils';

/**
 * Conteudo das abas de mercado (Fundamentos/Balanco/Resultados/Dividendos/
 * Sobre), compartilhado entre `AssetDetail` (rota `/asset/:symbol`, qualquer
 * ativo do mercado) e `MyAssetDetail` (rota `/portfolio/asset/...`, ativo da
 * carteira do usuario). So o `symbol`/payload de mercado muda entre os dois
 * contextos — a logica de leitura dos indicadores e o layout das abas ficam
 * aqui para nao duplicar (TRA-118).
 */

function renderRestricted(label: string) {
  return (
    <div className="flex justify-between items-center opacity-60">
      <span className="text-sm font-medium">{label}</span>
      <Badge variant="outline" className="text-[10px] py-0 px-1 border-dashed">
        EM BREVE
      </Badge>
    </div>
  );
}

function SimpleIndicatorItem({
  label,
  value,
  isRestricted,
  formatter = (v: any) => v,
}: {
  label: string;
  value: any;
  isRestricted?: boolean;
  formatter?: (value: any) => any;
}) {
  if (isRestricted || value === 0 || value === undefined || value === null) {
    return renderRestricted(label);
  }
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
        {label}
        <Info className="h-3 w-3 cursor-help" />
      </div>
      <span className="font-bold text-sm">{formatter(value)}</span>
    </div>
  );
}

/**
 * Le a cascata UMA vez por linha e distribui status/value/source do mesmo
 * resultado, para a linha nunca mostrar o numero de um indicador sob o
 * rotulo/status de outro. Ver detalhamento original em `AssetDetail`.
 */
export function FundamentalRow({
  label,
  fundamentals,
  indicatorKey,
  formatter,
}: {
  label: string;
  fundamentals: unknown;
  indicatorKey: FundamentalKey;
  formatter?: (value: number) => string;
}) {
  const {status, value, source} = readIndicator(fundamentals, indicatorKey);

  return (
    <FundamentalIndicatorItem
      label={label}
      status={status}
      value={value}
      source={source}
      formatter={formatter}
    />
  );
}

export interface MarketFinancial {
  revenue: number;
  net_income: number;
  total_assets: number;
  total_debt: number;
  shareholders_equity: number;
}

export interface MarketCompany {
  description: string;
  sector: string;
  industry: string;
  employees: number;
  headquarters: string;
}

export function FundamentalsTabContent({
  fundamentals,
  dividendYield,
  lastDividend,
  isDividendsRestricted,
}: {
  fundamentals: unknown;
  dividendYield: number | null | undefined;
  lastDividend: number | null | undefined;
  isDividendsRestricted: boolean;
}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
        <SectionHeader title="Valuation" />
        <div style={{padding: '8px 16.8px 14px'}}>
          <FundamentalRow label="P/L (PREÇO/LUCRO)" fundamentals={fundamentals} indicatorKey="priceEarnings" formatter={(v: number) => v.toFixed(2)} />
          <FundamentalRow label="P/VP" fundamentals={fundamentals} indicatorKey="priceToBook" formatter={(v: number) => v.toFixed(2)} />
          <FundamentalRow label="EV/EBITDA" fundamentals={fundamentals} indicatorKey="evEbitda" formatter={(v: number) => v.toFixed(2)} />
          <SimpleIndicatorItem label="DIVIDEND YIELD" value={dividendYield} isRestricted={isDividendsRestricted} formatter={formatPercentage} />
        </div>
      </div>
      <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
        <SectionHeader title="Eficiência &amp; Rentabilidade" />
        <div style={{padding: '8px 16.8px 14px'}}>
          <FundamentalRow label="ROE" fundamentals={fundamentals} indicatorKey="returnOnEquity" formatter={formatPercentage} />
          <FundamentalRow label="ROIC" fundamentals={fundamentals} indicatorKey="roic" formatter={formatPercentage} />
          <FundamentalRow label="MARGEM LÍQUIDA" fundamentals={fundamentals} indicatorKey="netMargin" formatter={formatPercentage} />
          <FundamentalRow label="DÍVIDA LÍQUIDA" fundamentals={fundamentals} indicatorKey="netDebt" formatter={formatCurrency} />
          <SimpleIndicatorItem label="ÚLTIMO DIVIDENDO" value={lastDividend} isRestricted={isDividendsRestricted} formatter={formatCurrency} />
          <FundamentalRow label="PAYOUT" fundamentals={fundamentals} indicatorKey="payout" formatter={formatPercentage} />
        </div>
      </div>
    </div>
  );
}

export function BalanceTabContent({
  financial,
  isFundamentalRestricted,
}: {
  financial: MarketFinancial;
  isFundamentalRestricted: boolean;
}) {
  return (
    <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
      <SectionHeader title="Balanço Patrimonial" subtitle="Resultados anuais" />
      {isFundamentalRestricted ? (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 0', gap: 8, opacity: 0.5}}>
          <Clock className="h-10 w-10" style={{color: 'var(--color-neutral-500)'}} />
          <p style={{fontWeight: 600, fontSize: 13}}>Dados financeiros detalhados em breve</p>
          <p style={{fontSize: 11, color: 'var(--color-neutral-500)'}}>Requer upgrade no plano da API Brapi</p>
        </div>
      ) : (
        <DataTable columns={[{label: 'Item'}, {label: 'Valor', align: 'right'}]}>
          <tr><td style={TD_STYLE}>Receita Líquida</td><td style={TD_RIGHT}>{formatCurrency(financial.revenue)}</td></tr>
          <tr><td style={TD_STYLE}>Lucro Líquido</td><td style={TD_RIGHT}>{formatCurrency(financial.net_income)}</td></tr>
          <tr><td style={TD_STYLE}>Patrimônio Líquido</td><td style={TD_RIGHT}>{formatCurrency(financial.shareholders_equity)}</td></tr>
          <tr><td style={TD_STYLE}>Ativo Total</td><td style={TD_RIGHT}>{formatCurrency(financial.total_assets)}</td></tr>
          <tr><td style={TD_STYLE}>Dívida Total</td><td style={TD_RIGHT}>{formatCurrency(financial.total_debt)}</td></tr>
        </DataTable>
      )}
    </div>
  );
}

export function ResultsTabContent({
  financialHistoryData,
  cashflowSection,
  price,
  sharesOutstanding,
  dividendYield,
}: {
  financialHistoryData: FinancialHistoryRow[];
  cashflowSection: CashflowSection;
  price: number;
  sharesOutstanding: number;
  dividendYield: number | null | undefined;
}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
        <SectionHeader title="Histórico de Lucro e Receita" action={<Badge variant="outline">5 anos</Badge>} />
        <div style={{padding: 16.8, height: 360}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialHistoryData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="year" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(Number(v))} />
              <Tooltip cursor={{fill: 'transparent'}} content={({active, payload, label}) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{background: 'var(--nk-card)', border: '1px solid var(--hair)', borderRadius: 8, padding: 14}}>
                      <p style={{fontWeight: 700, marginBottom: 8}}>{label}</p>
                      {payload.map((p: any, i: number) => (
                        <div key={i} style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600}}>
                          <div style={{width: 8, height: 8, borderRadius: '50%', background: p.color}} />
                          <span style={{color: 'var(--color-neutral-500)'}}>{p.name}:</span>
                          <span>{formatCurrency(Number(p.value || 0))}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }} />
              <Legend iconType="circle" />
              <Bar dataKey="revenue" name="Receita Líquida" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="profit" name="Lucro Líquido" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
        <SectionHeader title="Balanço — Comparativo" />
        <DataTable columns={[
          {label: 'Ano'},
          {label: 'P/L', align: 'right'},
          {label: 'P/VP', align: 'right'},
          {label: 'VPA', align: 'right'},
          {label: 'Margem Líq.', align: 'right'},
          {label: 'ROE', align: 'right'},
          {label: 'Div. Yield', align: 'right'},
        ]} minWidth={640}>
          {financialHistoryData.slice().reverse().map((row) => {
            const rowYear = Number(row.year || 0);
            const rowRevenue = Number(row.revenue || 0);
            const rowProfit = Number(row.profit || 0);
            const rowEquity = Number(row.shareholdersEquity || 0);
            const rowRoe = rowEquity > 0 ? (rowProfit / rowEquity) * 100 : 0;
            const rowNetMargin = rowRevenue > 0 ? (rowProfit / rowRevenue) * 100 : 0;
            return (
              <tr key={rowYear}>
                <td style={TD_STYLE}><strong>{rowYear || '-'}</strong></td>
                <td style={TD_RIGHT}>{price > 0 && rowProfit > 0 ? ((price * (Number(sharesOutstanding || 0) || 1)) / rowProfit).toFixed(2) : '—'}</td>
                <td style={TD_RIGHT}>{rowEquity > 0 && price > 0 ? (price / (rowEquity / (Number(sharesOutstanding || 0) || 1))).toFixed(2) : '—'}</td>
                <td style={TD_RIGHT}>{rowEquity > 0 && Number(sharesOutstanding || 0) > 0 ? formatCurrency(rowEquity / Number(sharesOutstanding || 1)) : '—'}</td>
                <td style={{...TD_RIGHT, color: 'var(--pos)'}}>{Number.isFinite(rowNetMargin) ? `${rowNetMargin.toFixed(2)}%` : '—'}</td>
                <td style={{...TD_RIGHT, color: 'var(--pos)'}}>{Number.isFinite(rowRoe) ? `${rowRoe.toFixed(2)}%` : '—'}</td>
                <td style={{...TD_RIGHT, color: 'var(--cy)'}}>{dividendYield ? `${dividendYield.toFixed(2)}%` : '—'}</td>
              </tr>
            );
          })}
        </DataTable>
        {financialHistoryData.length === 0 && (
          <p style={{padding: 16.8, fontSize: 11, color: 'var(--color-neutral-500)'}}>Ainda não recebemos histórico financeiro para este ativo nas fontes atuais.</p>
        )}
      </div>
      <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
        <SectionHeader title="Demonstrativo de Fluxo de Caixa" subtitle="Dados reais do ano mais recente. '—' indica ausência de dados." />
        <DataTable columns={[
          {label: 'Categoria'},
          ...cashflowSection.years.map((y) => ({label: `Valor ${y}`, align: 'right' as const})),
        ]} minWidth={560}>
          {cashflowSection.rows.map((row) => (
            <tr key={row.label}>
              <td style={TD_STYLE}>{row.label}</td>
              {cashflowSection.years.map((year) => {
                const val = row.values[year];
                return <td key={year} style={TD_RIGHT}>{typeof val === 'number' ? formatCurrency(val) : '—'}</td>;
              })}
            </tr>
          ))}
        </DataTable>
        {!cashflowSection.hasAnyData && (
          <p style={{padding: 16.8, fontSize: 11, color: 'var(--color-neutral-500)'}}>Ainda não recebemos dados de fluxo de caixa para este ativo nas fontes atuais.</p>
        )}
      </div>
    </div>
  );
}

export function DividendsTabContent({
  dividendHistory,
  isDividendsRestricted,
}: {
  dividendHistory: {date: string; value: number}[];
  isDividendsRestricted: boolean;
}) {
  return (
    <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
      <SectionHeader title="Histórico de Dividendos" />
      {isDividendsRestricted ? (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 0', gap: 8, opacity: 0.5}}>
          <p style={{fontWeight: 600, fontSize: 13}}>Dados de dividendos em breve</p>
        </div>
      ) : dividendHistory.length === 0 ? (
        <p style={{padding: 16.8, fontSize: 12, color: 'var(--color-neutral-500)'}}>Sem histórico de dividendos disponível.</p>
      ) : (
        <DataTable columns={[{label: 'Data'}, {label: 'Valor por ação', align: 'right'}]}>
          {dividendHistory.map((d, i) => (
            <tr key={i}>
              <td style={TD_STYLE}>{d.date}</td>
              <td style={TD_RIGHT}>{formatCurrency(d.value)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

export function AboutTabContent({company}: {company: MarketCompany}) {
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
        <SectionHeader title="Descrição do Negócio" />
        <div style={{padding: 16.8}}>
          <p style={{fontSize: 14, lineHeight: 1.65, color: 'var(--color-neutral-400)', maxWidth: '72ch'}}>
            {company.description || 'Descrição indisponível no momento.'}
          </p>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22.4, marginTop: 28, paddingTop: 22.4, borderTop: '1px solid var(--hair-soft)'}}>
            {[
              {label: 'Setor / Indústria', value: `${company.sector} / ${company.industry}`},
              {label: 'Sede', value: company.headquarters || 'Não informado'},
              {label: 'Funcionários', value: company.employees > 0 ? company.employees.toLocaleString() : '—'},
            ].map((item) => (
              <div key={item.label}>
                <div style={{fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-500)', marginBottom: 6}}>{item.label}</div>
                <div style={{fontWeight: 600, fontSize: 13}}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
