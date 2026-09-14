import {useReducer, type CSSProperties, type ReactNode} from 'react';
import {useMutation} from '@tanstack/react-query';
import {fiscalService} from '@/server/api/api';
import useAppToast from '@/hooks/use-app-toast';
import {useBrokerUploads} from '@/hooks/useFiscal';
import {badgeStyle} from '@/components/shared/badge-style';
import {formatCurrency} from '@/utils/formatters';
import {
  STOCK_EXEMPTION_LIMIT,
  type FiscalOptimizerResponse,
  type FiscalTaxDriver,
} from '@/services/fiscal/fiscal-summary';

/*
 * Ferramentas que já existiam na tela Fiscal e não estão no handoff (simulador
 * de venda, status das importações, guia do IR e relatórios em PDF). Seguem no
 * mesmo desenho de card para não perder funcionalidade.
 */

const cardStyle: CSSProperties = {border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'};
const inputStyle: CSSProperties = {
  height: 34,
  padding: '0 11.2px',
  border: '1px solid var(--hair)',
  borderRadius: 8,
  background: 'rgba(var(--rgb-bg),0.6)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  fontVariantNumeric: 'tabular-nums',
  width: '100%',
  boxSizing: 'border-box',
};
const outlineClass =
  'text-[color:var(--color-neutral-300)] hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)] disabled:cursor-not-allowed disabled:opacity-60';
const outlineStyle: CSSProperties = {
  height: 34,
  padding: '0 14px',
  borderRadius: 8,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--hair)',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  cursor: 'pointer',
};
const noteStyle: CSSProperties = {
  borderRadius: 8,
  border: '1px solid var(--hair-soft)',
  background: 'rgba(var(--rgb-bg),0.4)',
  padding: '11.2px 14px',
  fontSize: 12,
  color: 'var(--color-neutral-400)',
  lineHeight: 1.5,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

function Card({title, subtitle, action, children}: {title: string; subtitle?: string; action?: ReactNode; children: ReactNode}) {
  return (
    <section style={cardStyle}>
      <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 11.2}}>
        <div>
          <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0}}>{title}</h2>
          {subtitle && <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2}}>{subtitle}</div>}
        </div>
        {action}
      </div>
      <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 11.2}}>{children}</div>
    </section>
  );
}

interface SimulatorForm {
  symbol: string;
  quantity: string;
  sellPrice: string;
}

function simulatorReducer(state: SimulatorForm, patch: Partial<SimulatorForm>): SimulatorForm {
  return {...state, ...patch};
}

function SaleSimulatorCard({optimizer, taxDrivers}: {optimizer?: FiscalOptimizerResponse; taxDrivers: FiscalTaxDriver[]}) {
  const [form, update] = useReducer(simulatorReducer, {symbol: '', quantity: '', sellPrice: ''});
  const preview = useMutation({
    mutationFn: async () =>
      (
        await fiscalService.previewSale({
          symbol: form.symbol.trim().toUpperCase(),
          quantity: Number(form.quantity),
          sellPrice: Number(form.sellPrice.replace(',', '.')),
        })
      ).data,
  });
  const canSimulate = form.symbol.trim().length >= 4 && Number(form.quantity) > 0 && Number(form.sellPrice.replace(',', '.')) > 0;

  const data = preview.data;
  const accumulatedLoss = optimizer?.accumulatedLosses?.total ?? 0;
  const exemptionLimit = data?.stockExemptionLimit || STOCK_EXEMPTION_LIMIT;
  const exemptByMonthlyLimit = data?.category === 'stock' && (data?.stockSalesMonth || 0) <= exemptionLimit;
  const zeroTax = (data?.estimatedTax || 0) <= 0;
  const zeroByLossOffset = data?.category === 'stock' && (data?.profit || 0) > 0 && accumulatedLoss > 0 && !exemptByMonthlyLimit && zeroTax;
  const zeroTaxReason = !zeroTax
    ? null
    : exemptByMonthlyLimit
      ? `Imposto zerado por isenção de vendas mensais (até ${formatCurrency(exemptionLimit)} em ações).`
      : zeroByLossOffset
        ? 'Imposto zerado por compensação de prejuízo acumulado.'
        : null;
  const opportunity = optimizer?.opportunities?.[0];

  const fields: {key: keyof SimulatorForm; label: string; placeholder: string; inputMode: 'text' | 'numeric' | 'decimal'}[] = [
    {key: 'symbol', label: 'Ativo', placeholder: 'PETR4', inputMode: 'text'},
    {key: 'quantity', label: 'Quantidade', placeholder: '100', inputMode: 'numeric'},
    {key: 'sellPrice', label: 'Preço de venda', placeholder: '50,00', inputMode: 'decimal'},
  ];

  return (
    <Card title="Simular venda" subtitle="Quanto de imposto uma venda gera antes de você executar">
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 11.2}}>
        {fields.map((field) => (
          <label key={field.key} style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
            <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>{field.label}</span>
            <input
              value={form[field.key]}
              inputMode={field.inputMode}
              placeholder={field.placeholder}
              aria-label={field.label}
              onChange={(event) => update({[field.key]: event.target.value})}
              style={inputStyle}
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={() => preview.mutate()}
        disabled={!canSimulate || preview.isPending}
        className="hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-60"
        style={{alignSelf: 'flex-start', height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'}}>
        {preview.isPending ? 'Calculando…' : 'Calcular imposto'}
      </button>
      {preview.isError && <div style={{fontSize: 12, color: 'var(--neg)'}}>Não foi possível simular agora. Confira o ativo e tente de novo.</div>}

      {data && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 8.4}} data-testid="fiscal-sale-preview">
          <div style={{fontSize: 12.5, fontWeight: 600}}>Se vender {data.symbol} hoje:</div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8.4}}>
            {[
              {label: 'Lucro', value: formatCurrency(data.profit || 0), color: (data.profit || 0) < 0 ? 'var(--neg)' : 'var(--pos)'},
              {label: 'Imposto', value: formatCurrency(data.estimatedTax || 0), color: 'var(--warn)'},
              {label: 'Peso na carteira', value: `${(data.portfolioImpactPercent || 0).toFixed(2)}%`, color: 'var(--color-neutral-100)'},
            ].map((item) => (
              <div key={item.label} style={{border: '1px solid var(--hair-soft)', borderRadius: 8, padding: '8.4px 11.2px'}}>
                <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', textTransform: 'uppercase', letterSpacing: '0.08em'}}>{item.label}</div>
                <div style={{fontSize: 14, fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums', color: item.color}}>{item.value}</div>
              </div>
            ))}
          </div>
          {zeroTaxReason && <div style={{fontSize: 12, color: 'var(--pos)'}}>{zeroTaxReason}</div>}
          {data.category === 'stock' && (
            <div style={{fontSize: 11.5, color: 'var(--color-neutral-500)'}}>
              Vendas de ações no mês: {formatCurrency(data.stockSalesMonth || 0)} de {formatCurrency(exemptionLimit)} isentos
              {data.sector ? ` · setor ${data.sector}` : ''}
            </div>
          )}
          {data.message && <div style={{fontSize: 11.5, color: 'var(--color-neutral-500)'}}>{data.message}</div>}
          <div style={noteStyle}>
            <span>
              Prejuízo acumulado a compensar: <strong>{formatCurrency(accumulatedLoss)}</strong>.
            </span>
            {zeroByLossOffset && (
              <span>
                Vendendo <strong>{data.symbol}</strong> agora, o imposto da operação fica <strong>zero</strong>.
              </span>
            )}
          </div>
          {opportunity && (
            <div style={noteStyle}>
              <strong style={{color: 'var(--color-neutral-200)'}}>Otimização fiscal possível</strong>
              <span>
                Realizar prejuízo em {opportunity.symbol}
                {typeof opportunity.potentialGain === 'number' && opportunity.potentialGain > 0
                  ? ` de ${formatCurrency(opportunity.potentialGain)}`
                  : ''}{' '}
                reduz o imposto de operações futuras com lucro.
              </span>
              <span style={{fontSize: 11}}>
                Sem compensação {formatCurrency(opportunity.estimatedTaxWithoutOffset || 0)} · com compensação{' '}
                {formatCurrency(opportunity.estimatedTaxWithOffset || 0)} · economia {formatCurrency(opportunity.taxSaved || 0)}
              </span>
            </div>
          )}
          {taxDrivers.length > 0 && (
            <div style={noteStyle}>
              <strong style={{color: 'var(--color-neutral-200)'}}>Ativos que mais pesam no imposto do ano</strong>
              {taxDrivers.slice(0, 3).map((driver) => (
                <span key={driver.symbol}>
                  {driver.symbol}: {formatCurrency(driver.estimatedTax)} ({driver.reason})
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

type Upload = {_id: string; originalName: string; provider: string; status: string; errorMessage?: string};

const UPLOAD_STATUS: Record<string, {label: string; severity: 'ok' | 'neg' | 'info'}> = {
  processed: {label: 'Processado', severity: 'ok'},
  failed: {label: 'Falhou', severity: 'neg'},
};

function ImportsStatusCard({hasMonthly}: {hasMonthly: boolean}) {
  const {data, isLoading} = useBrokerUploads();
  const uploads: Upload[] = Array.isArray(data) ? data.slice(0, 6) : [];

  return (
    <Card title="Status das importações" subtitle="Notas e extratos usados na apuração">
      {isLoading && <div style={{fontSize: 12, color: 'var(--color-neutral-500)'}}>Carregando…</div>}
      {!isLoading && uploads.length === 0 && <div style={{fontSize: 12, color: 'var(--color-neutral-500)'}}>Nenhum upload recente.</div>}
      {!hasMonthly && (
        <div style={{fontSize: 11.5, color: 'var(--color-neutral-500)', lineHeight: 1.5}}>
          Sem vendas apuradas no ano. Se você importou só a posição consolidada da B3, o resumo fiscal fica zerado.
        </div>
      )}
      {uploads.map((upload) => {
        const status = UPLOAD_STATUS[upload.status] ?? {label: upload.status, severity: 'info' as const};
        return (
          <div key={upload._id} style={{display: 'flex', alignItems: 'center', gap: 11.2, border: '1px solid var(--hair-soft)', borderRadius: 8, padding: '8.4px 11.2px'}}>
            <div style={{flex: 1, minWidth: 0}}>
              <div style={{fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{upload.originalName}</div>
              <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)'}}>{upload.provider}</div>
              {upload.errorMessage && <div style={{fontSize: 11, color: 'var(--neg)'}}>{upload.errorMessage}</div>}
            </div>
            <span style={badgeStyle(status.severity)}>{status.label}</span>
          </div>
        );
      })}
    </Card>
  );
}

const REPORTS = [
  {type: 'fiscal', label: 'Fiscal'},
  {type: 'transactions', label: 'Transações'},
  {type: 'assets', label: 'Ativos'},
] as const;

function IrGuideCard({guide, year, years, onYearChange}: {guide: string[]; year?: number; years: number[]; onYearChange: (year: number) => void}) {
  const toast = useAppToast();
  const download = useMutation({
    mutationFn: async ({type}: {type: (typeof REPORTS)[number]['type']; label: string}) => {
      const response = await fiscalService.getReport({type, year, format: 'pdf'});
      const url = window.URL.createObjectURL(new Blob([response.data], {type: 'application/pdf'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-report-${year ?? 'atual'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: (_, {label}) => toast.success('Relatório gerado', `${label} baixado com sucesso.`),
    onError: () => toast.error('Erro', 'Não foi possível gerar o relatório.'),
  });

  return (
    <Card
      title="Declaração do IR"
      subtitle="Passo a passo e relatórios em PDF"
      action={
        <select
          aria-label="Ano"
          value={year ?? ''}
          onChange={(event) => onYearChange(Number(event.target.value))}
          style={{...inputStyle, width: 'auto', height: 30}}>
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      }>
      <ol style={{margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5.6, fontSize: 12.5, color: 'var(--color-neutral-300)', lineHeight: 1.5}}>
        {guide.map((line, index) => (
          <li key={`${index}-${line}`}>{line.replace(/^Passo \d+:\s*/, '')}</li>
        ))}
      </ol>
      <div style={{display: 'flex', gap: 8.4, flexWrap: 'wrap', paddingTop: 11.2, borderTop: '1px solid var(--hair-soft)'}}>
        {REPORTS.map((report) => (
          <button
            key={report.type}
            type="button"
            disabled={download.isPending}
            onClick={() => download.mutate({type: report.type, label: `Relatório de ${report.label}`})}
            className={outlineClass}
            style={outlineStyle}>
            <i className="ph ph-file-pdf" style={{fontSize: 14, marginRight: 5.6}} aria-hidden />
            {report.label} (PDF)
          </button>
        ))}
      </div>
    </Card>
  );
}

export function FiscalToolsSection(props: {
  optimizer?: FiscalOptimizerResponse;
  taxDrivers: FiscalTaxDriver[];
  hasMonthly: boolean;
  guide: string[];
  year?: number;
  onYearChange: (year: number) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Set([props.year ?? currentYear, ...Array.from({length: 6}, (_, i) => currentYear - i)])).sort((a, b) => b - a);

  return (
    <div className="grid grid-cols-1 items-start gap-[16.8px] lg:grid-cols-2">
      <SaleSimulatorCard optimizer={props.optimizer} taxDrivers={props.taxDrivers} />
      <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
        <IrGuideCard guide={props.guide} year={props.year} years={years} onYearChange={props.onYearChange} />
        <ImportsStatusCard hasMonthly={props.hasMonthly} />
      </div>
    </div>
  );
}
