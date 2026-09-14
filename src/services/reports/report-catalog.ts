import type {ReportFormat, ReportFrequency, ReportKind} from '@/server/api/api';

export type ReportTint = 'accent' | 'pos' | 'warn';

export interface ReportType {
  kind: ReportKind;
  title: string;
  body: string;
  icon: string;
  formats: ReportFormat[];
  primary: boolean;
  tint: ReportTint;
  /** Relatórios de declaração olham o ano fechado até o fim do prazo do IR. */
  closedYearUntilMay: boolean;
}

/** Textos e ordem de `reportTypes` em design_handoff_trackerr/Trackerr App.dc.html. */
export const REPORT_TYPES: ReportType[] = [
  {
    kind: 'portfolio',
    title: 'Carteira consolidada',
    body: 'Posições, alocação e resultado de todas as contas em um documento.',
    icon: 'ph-fill ph-briefcase',
    formats: ['pdf', 'xlsx'],
    primary: true,
    tint: 'accent',
    closedYearUntilMay: false,
  },
  {
    kind: 'income',
    title: 'Informe de rendimentos',
    body: 'Proventos recebidos por ativo e por mês, no formato aceito na declaração.',
    icon: 'ph-fill ph-hand-coins',
    formats: ['pdf', 'csv'],
    primary: false,
    tint: 'pos',
    closedYearUntilMay: true,
  },
  {
    kind: 'fiscal',
    title: 'Apuração fiscal anual',
    body: 'Ganhos, perdas, prejuízo a compensar e DARFs do exercício, mês a mês.',
    icon: 'ph-fill ph-receipt',
    formats: ['pdf', 'xlsx'],
    primary: false,
    tint: 'warn',
    closedYearUntilMay: true,
  },
  {
    kind: 'risk',
    title: 'Relatório de risco',
    body: 'VaR, Sharpe, beta, drawdown, correlação e contribuição de risco por ativo.',
    icon: 'ph-fill ph-gauge',
    formats: ['pdf'],
    primary: false,
    tint: 'accent',
    closedYearUntilMay: false,
  },
  {
    kind: 'operations',
    title: 'Extrato de operações',
    body: 'Todas as compras, vendas e taxas no período escolhido.',
    icon: 'ph-fill ph-arrows-left-right',
    formats: ['csv', 'xlsx'],
    primary: false,
    tint: 'accent',
    closedYearUntilMay: false,
  },
  {
    kind: 'accountant',
    title: 'Pacote do contador',
    body: 'Tudo que um contador pede, em um zip: fiscal, proventos e operações.',
    icon: 'ph-fill ph-folder-open',
    formats: ['zip'],
    primary: false,
    tint: 'pos',
    closedYearUntilMay: true,
  },
];

export const FREQUENCY_LABELS: Record<ReportFrequency, string> = {
  weekly: 'semanal',
  monthly: 'mensal',
  quarterly: 'trimestral',
  yearly: 'anual',
};

export const reportTypeOf = (kind: ReportKind) => REPORT_TYPES.find((type) => type.kind === kind)!;

/** Ano sugerido: de janeiro a maio, declaração ainda é do ano anterior. */
export function defaultYearFor(type: ReportType, today = new Date()): number {
  const year = today.getFullYear();
  return type.closedYearUntilMay && today.getMonth() <= 4 ? year - 1 : year;
}

export const formatLabel = (format: ReportFormat) => format.toUpperCase();
