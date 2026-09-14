import {formatCurrency} from '@/utils/formatters';
import type {BadgeSeverity} from '@/components/shared/badge-style';

export interface FiscalMonth {
  year: number;
  month: number;
  stockSales: number;
  stockProfit: number;
  fiiProfit: number;
  cryptoProfit: number;
  stockTax: number;
  fiiTax: number;
  cryptoTax: number;
  totalTax: number;
  stockExempt: boolean;
  // Campos novos do server (TRA-170): opcionais até o deploy chegar.
  stockCompensatedLoss?: number;
  stockTaxableBase?: number;
  fiiSales?: number;
  cryptoSales?: number;
  cryptoExempt?: boolean;
  accumulatedLoss?: number;
}

export interface FiscalTaxDriver {
  symbol: string;
  category: 'stock' | 'fii' | 'crypto';
  operations: number;
  grossSales: number;
  realizedProfit: number;
  estimatedTax: number;
  taxRate: number;
  reason: string;
}

export interface FiscalSummaryResponse {
  year: number;
  totals?: {stockProfit?: number; fiiProfit?: number; cryptoProfit?: number; taxDue?: number};
  monthly?: FiscalMonth[];
  taxDrivers?: FiscalTaxDriver[];
  guide?: string[];
}

export interface FiscalOptimizerResponse {
  accumulatedLosses?: {stock?: number; fii?: number; crypto?: number; total?: number};
  opportunities?: Array<{
    symbol: string;
    headline?: string;
    potentialGain?: number;
    estimatedTaxWithoutOffset?: number;
    estimatedTaxWithOffset?: number;
    taxSaved?: number;
  }>;
}

export const STOCK_EXEMPTION_LIMIT = 20000;
export const CRYPTO_EXEMPTION_LIMIT = 35000;
/** A Receita não aceita DARF abaixo de R$ 10: o valor soma ao mês seguinte. */
export const DARF_MINIMUM = 10;

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export const monthShortLabel = (m: Pick<FiscalMonth, 'year' | 'month'>) => `${MONTHS[m.month - 1]}/${m.year}`;
export const monthName = (month: number) => MONTH_NAMES[month - 1] ?? String(month);

/** Mês mais recente com apuração (o server devolve em ordem crescente). */
export function latestMonth(monthly: FiscalMonth[] | undefined): FiscalMonth | null {
  return monthly?.length ? monthly[monthly.length - 1] : null;
}

/**
 * Vencimento do DARF de renda variável: último dia útil do mês seguinte ao da
 * apuração. Considera só fins de semana — feriados nacionais ficam de fora.
 */
export function darfDueDate(m: Pick<FiscalMonth, 'year' | 'month'>): Date {
  // Dia 0 do mês m+2 = último dia do mês m+1 (month é 1-12).
  const due = new Date(m.year, m.month + 1, 0);
  while (due.getDay() === 0 || due.getDay() === 6) due.setDate(due.getDate() - 1);
  return due;
}

/** 6015 para ações/FIIs em operações comuns; 4600 quando só há ganho em cripto. */
export function darfCode(m: FiscalMonth): '6015' | '4600' {
  return m.stockTax + m.fiiTax <= 0 && m.cryptoTax > 0 ? '4600' : '6015';
}

export type CalcTone = 'neutral' | 'positive' | 'negative' | 'total';

export interface CalcRow {
  label: string;
  value: string;
  tone: CalcTone;
}

const signed = (value: number) => (value < 0 ? `− ${formatCurrency(Math.abs(value))}` : formatCurrency(value));

/** "Apuração do mês, linha por linha", no formato do handoff. */
export function buildCalcRows(m: FiscalMonth): CalcRow[] {
  const rows: CalcRow[] = [
    {label: 'Vendas de ações no mês', value: formatCurrency(m.stockSales), tone: 'neutral'},
    {
      label: 'Ganho líquido apurado',
      value: signed(m.stockProfit),
      tone: m.stockProfit < 0 ? 'negative' : m.stockProfit > 0 ? 'positive' : 'neutral',
    },
    {
      label: `Isenção de ${formatCurrency(STOCK_EXEMPTION_LIMIT)} aplicada`,
      value: m.stockExempt && m.stockProfit > 0 ? 'sim' : 'não se aplica',
      tone: 'neutral',
    },
    {label: 'Prejuízo compensado', value: `− ${formatCurrency(m.stockCompensatedLoss ?? 0)}`, tone: 'neutral'},
    {label: 'Base de cálculo', value: formatCurrency(m.stockTaxableBase ?? 0), tone: 'neutral'},
  ];
  const hasOtherTax = m.fiiTax > 0 || m.cryptoTax > 0;
  if (hasOtherTax) {
    rows.push({label: 'Imposto sobre ações (15%)', value: formatCurrency(m.stockTax), tone: 'neutral'});
    if (m.fiiTax > 0) rows.push({label: 'Imposto sobre FIIs (20%)', value: formatCurrency(m.fiiTax), tone: 'neutral'});
    if (m.cryptoTax > 0) rows.push({label: 'Imposto sobre cripto (15%)', value: formatCurrency(m.cryptoTax), tone: 'neutral'});
  }
  rows.push({
    label: hasOtherTax ? 'Imposto devido no mês' : 'Imposto devido (15%)',
    value: formatCurrency(m.totalTax),
    tone: 'total',
  });
  return rows;
}

export interface FiscalBucket {
  title: string;
  status: string;
  severity: BadgeSeverity;
  sub: string;
  rows: {label: string; value: string; tone: CalcTone}[];
}

const taxTone = (tax: number): CalcTone => (tax > 0 ? 'total' : 'positive');

export function buildBuckets(m: FiscalMonth): FiscalBucket[] {
  const cryptoSales = m.cryptoSales ?? 0;
  return [
    {
      title: 'Ações',
      status: m.stockTax > 0 ? 'Com imposto' : 'Sem imposto',
      severity: m.stockTax > 0 ? 'warn' : 'ok',
      sub: `Isenção de ${formatCurrency(STOCK_EXEMPTION_LIMIT)} por mês em vendas; ganho acima disso paga 15%.`,
      rows: [
        {label: 'Vendas no mês', value: formatCurrency(m.stockSales), tone: 'neutral'},
        {label: 'Ganho apurado', value: signed(m.stockProfit), tone: m.stockProfit < 0 ? 'negative' : 'positive'},
        {label: 'Imposto', value: formatCurrency(m.stockTax), tone: taxTone(m.stockTax)},
      ],
    },
    {
      title: 'FIIs',
      status: m.fiiTax > 0 ? 'Com imposto' : 'Sem imposto',
      severity: m.fiiTax > 0 ? 'warn' : 'ok',
      sub: 'Rendimentos isentos para pessoa física; ganho na venda de cota paga 20%.',
      rows: [
        {label: 'Vendas de cotas', value: formatCurrency(m.fiiSales ?? 0), tone: 'neutral'},
        {label: 'Ganho apurado', value: signed(m.fiiProfit), tone: m.fiiProfit < 0 ? 'negative' : 'positive'},
        {label: 'Imposto', value: formatCurrency(m.fiiTax), tone: taxTone(m.fiiTax)},
      ],
    },
    {
      title: 'Cripto',
      status: m.cryptoTax > 0 ? 'Com imposto' : cryptoSales <= CRYPTO_EXEMPTION_LIMIT ? 'Abaixo do limite' : 'Sem imposto',
      severity: m.cryptoTax > 0 ? 'warn' : 'ok',
      sub: `Isento até ${formatCurrency(CRYPTO_EXEMPTION_LIMIT)} de venda por mês; acima disso, 15% sobre o ganho.`,
      rows: [
        {label: 'Vendas no mês', value: formatCurrency(cryptoSales), tone: 'neutral'},
        {label: 'Limite de isenção', value: formatCurrency(CRYPTO_EXEMPTION_LIMIT), tone: 'neutral'},
        {label: 'Imposto', value: formatCurrency(m.cryptoTax), tone: taxTone(m.cryptoTax)},
      ],
    },
  ];
}

export interface HistoryRow {
  key: string;
  month: string;
  sales: string;
  result: string;
  resultPositive: boolean;
  carry: string;
  darf: string;
  status: string;
  severity: BadgeSeverity;
}

export function buildHistoryRows(monthly: FiscalMonth[] | undefined): HistoryRow[] {
  return [...(monthly ?? [])].reverse().map((m) => {
    const result = m.stockProfit + m.fiiProfit + m.cryptoProfit;
    const status: Pick<HistoryRow, 'status' | 'severity'> =
      m.totalTax > 0
        ? {status: 'A pagar', severity: 'warn'}
        : result < 0
          ? {status: 'Prejuízo', severity: 'info'}
          : m.stockExempt && m.stockProfit > 0
            ? {status: 'Isento', severity: 'ok'}
            : {status: 'Sem imposto', severity: 'ok'};
    return {
      key: `${m.year}-${m.month}`,
      month: monthShortLabel(m),
      sales: formatCurrency(m.stockSales + (m.fiiSales ?? 0) + (m.cryptoSales ?? 0)),
      result: result > 0 ? `+${formatCurrency(result)}` : signed(result),
      resultPositive: result >= 0,
      carry: formatCurrency(m.accumulatedLoss ?? 0),
      darf: m.totalTax > 0 ? formatCurrency(m.totalTax) : '—',
      ...status,
    };
  });
}
