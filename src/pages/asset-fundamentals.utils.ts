import type {IndicatorStatus} from '@/components/asset/indicator-item';

/**
 * Espelha `FundamentalKey` do server
 * (`server/src/stocks/fundamentals/fundamentals.types.ts`). Manter os dois
 * lados iguais: uma chave errada aqui vira erro de compilacao, e nao uma
 * linha silenciosamente vazia na tela.
 */
export type FundamentalKey =
  | 'roic'
  | 'netMargin'
  | 'netDebt'
  | 'payout'
  | 'priceEarnings'
  | 'priceToBook'
  | 'evEbitda'
  | 'returnOnEquity';

export interface IndicatorView {
  status: IndicatorStatus;
  value: number | null;
  source: string | null;
}

const ABSENT: IndicatorView = {status: 'unavailable', value: null, source: null};

const KNOWN_STATUSES: IndicatorStatus[] = ['ok', 'unavailable', 'not_applicable'];

export function readIndicator(
  fundamentals: unknown,
  key: FundamentalKey,
): IndicatorView {
  const values = (fundamentals as any)?.values;
  const entry = values?.[key];
  if (!entry) return ABSENT;

  const status = entry.status as IndicatorStatus;
  if (!KNOWN_STATUSES.includes(status)) return ABSENT;

  if (status !== 'ok') {
    return {status, value: null, source: null};
  }

  return typeof entry.value === 'number' && Number.isFinite(entry.value)
    ? {status: 'ok', value: entry.value, source: entry.source ?? null}
    : ABSENT;
}

/**
 * Le `financialHistory` (payload cru do provedor de mercado) e devolve as
 * linhas anuais ja normalizadas/ordenadas usadas nos graficos e tabelas de
 * Resultados. Compartilhada entre `AssetDetail` (mercado, qualquer symbol) e
 * `MyAssetDetail` (posicao do usuario) para as duas telas lerem o mesmo
 * historico sem duplicar o parsing.
 */
export interface FinancialHistoryRow {
  year: number;
  revenue: number;
  profit: number;
  totalAssets: number;
  shareholdersEquity: number;
}

export function buildFinancialHistoryData(s: unknown): FinancialHistoryRow[] {
  const raw = (s as any)?.financialHistory;
  return Array.isArray(raw)
    ? [...raw]
        .filter((row: any) => typeof row?.year === 'number')
        .sort((a: any, b: any) => a.year - b.year)
        .map((row: any) => ({
          year: row.year,
          revenue: Number(row.revenue || 0),
          profit: Number(row.netIncome || 0),
          totalAssets: Number(row.totalAssets || 0),
          shareholdersEquity: Number(row.shareholdersEquity || 0),
        }))
    : [];
}

function getNumericValue(source: unknown, keys: string[]): number | null {
  for (const key of keys) {
    const value = key
      .split('.')
      .reduce<any>((acc, part) => (acc ? acc[part] : undefined), source);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

export interface CashflowRow {
  label: string;
  values: Record<number, number | null>;
}

export interface CashflowSection {
  years: number[];
  rows: CashflowRow[];
  hasAnyData: boolean;
}

/**
 * Monta a tabela de Fluxo de Caixa (3 anos mais recentes) a partir do mesmo
 * payload de mercado. Mesma cascata de chaves de fallback usada
 * historicamente em `AssetDetail`; extraida para nao duplicar quando
 * `MyAssetDetail` passar a exibir a mesma aba.
 */
export function buildCashflowSection(s: unknown): CashflowSection {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  const rawHistory = (s as any)?.cashflowHistory;
  const historyByYear = new Map<number, unknown>(
    (Array.isArray(rawHistory) ? rawHistory : []).map((row: any) => [
      Number(row?.year),
      row,
    ]),
  );

  const buildRow = (
    label: string,
    key: string,
    fallbackKeys: string[],
  ): CashflowRow => ({
    label,
    values: {
      [currentYear]:
        getNumericValue(historyByYear.get(currentYear), [key]) ??
        getNumericValue(s, fallbackKeys),
      [currentYear - 1]: getNumericValue(historyByYear.get(currentYear - 1), [
        key,
      ]),
      [currentYear - 2]: getNumericValue(historyByYear.get(currentYear - 2), [
        key,
      ]),
    },
  });

  const rows: CashflowRow[] = [
    buildRow('CAIXA LÍQUIDO ATIVIDADES OPERACIONAIS', 'operatingCashflow', [
      'operatingCashflow',
      'financialData.operatingCashflow',
    ]),
    buildRow('CAIXA GERADO NAS OPERAÇÕES', 'operatingCashflow', [
      'operatingCashflow',
      'financialData.operatingCashflow',
    ]),
    buildRow('LUCRO LÍQUIDO', 'netIncome', [
      'netIncomeToCommon',
      'financialData.netIncome',
    ]),
    buildRow('DEPRECIAÇÃO/AMORTIZAÇÃO', 'depreciation', [
      'depreciation',
      'depreciationAndAmortization',
    ]),
    buildRow(
      'CAIXA LÍQUIDO ATIVIDADES INVESTIMENTO',
      'investingCashflow',
      ['investingCashflow', 'cashflowFromInvestment', 'capitalExpenditures'],
    ),
    buildRow(
      'CAIXA LÍQUIDO ATIVIDADES FINANCIAMENTO',
      'financingCashflow',
      ['financingCashflow', 'cashflowFromFinancing'],
    ),
    buildRow('FLUXO DE CAIXA LIVRE', 'freeCashflow', [
      'freeCashflow',
      'financialData.freeCashflow',
    ]),
  ];

  const hasAnyData = rows.some((row) =>
    years.some((year) => row.values[year] !== null),
  );

  return {years, rows, hasAnyData};
}
