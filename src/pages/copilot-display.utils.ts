import type {AdaptiveLevel} from '@/contexts/adaptive-level.mapping';
import type {PortfolioReturns} from '@/hooks/usePortfolioReturns';
import {BUCKET_LABEL, describeLargestGap} from '@/pages/composition-display.utils';
import {
  formatCurrencyCompactPtBr,
  formatCurrencyWholePtBr,
  formatPctPtBr,
  formatPpPtBr,
  formatSignedPctPtBr,
} from '@/utils/formatters';

/**
 * Vocabulário do Copiloto por nível, copiado do protótipo App do handoff
 * (`prompts`, `copilotMode` e `CHAT[level].metrics` da tela Copiloto). As
 * telas só consomem.
 */

export const COPILOT_PROMPTS: Record<AdaptiveLevel, string[]> = {
  iniciante: [
    'O que é diversificação?',
    'Quanto eu já recebi de proventos?',
    'Preciso fazer algo hoje?',
    'Explique meu resultado',
  ],
  intermediario: [
    'Comparar com o IBOV',
    'Quanto vou pagar de imposto?',
    'Simular aporte de R$ 20k',
    'Onde estou fora do alvo?',
  ],
  avancado: [
    'Decompor o VaR por fator',
    'Matriz de correlação',
    'Otimizar carry fiscal até dez',
    'Atribuição de retorno 12M',
  ],
};

export const copilotModeLabel = (level: AdaptiveLevel): string =>
  'Respondendo em modo ' +
  (level === 'iniciante'
    ? 'Iniciante · linguagem simples, sem jargão'
    : level === 'intermediario'
      ? 'Intermediário · benchmarks e impacto fiscal'
      : 'Avançado · métricas quantitativas e auditoria');

/** Tile de métrica da bolha do Copiloto no handoff (grade de 3). */
export interface CopilotMetric {
  label: string;
  value: string;
}

export interface CopilotMetricContext {
  intent?: string;
  level?: AdaptiveLevel;
  returns?: PortfolioReturns;
}

const ptBr2 = (value: number) =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Remove tiles sem valor: "N/D" seria ruído com cara de número. */
const compact = (metrics: Array<CopilotMetric | null>): CopilotMetric[] =>
  metrics.filter((metric): metric is CopilotMetric => metric !== null);

function correlationMetrics(matrix: any): CopilotMetric[] {
  const metrics: CopilotMetric[] = [
    {label: 'Correlação média', value: ptBr2(matrix.averageCorrelation)},
  ];
  for (const pair of [matrix.highestPair, matrix.lowestPair]) {
    if (pair && isNumber(pair.correlation)) {
      metrics.push({label: `${pair.a} × ${pair.b}`, value: ptBr2(pair.correlation)});
    }
  }
  return metrics;
}

function attributionMetrics(attribution: any): CopilotMetric[] {
  const top = attribution.topContributor;
  const detractor = attribution.topDetractor;
  return compact([
    {label: 'Retorno 12M', value: formatSignedPctPtBr(attribution.totalReturn * 100)},
    top && isNumber(top.contribution)
      ? {label: `Maior contribuição · ${top.symbol}`, value: formatPpPtBr(top.contribution * 100)}
      : null,
    detractor && isNumber(detractor.contribution)
      ? {label: `Maior detrator · ${detractor.symbol}`, value: formatPpPtBr(detractor.contribution * 100)}
      : null,
  ]);
}

function rebalancingMetrics(rebalancing: any): CopilotMetric[] {
  const line = describeLargestGap(rebalancing.largestGap);
  if (!line) return [];
  return compact([
    {label: 'Maior desvio', value: line.highlight},
    {label: 'Rebalancear', value: line.amount},
    isNumber(rebalancing.totalDriftPct)
      ? {label: 'Desvio total', value: `${formatPctPtBr(rebalancing.totalDriftPct, 1).replace('%', '')} p.p.`}
      : null,
  ]);
}

function contributionMetrics(simulation: any): CopilotMetric[] {
  return (simulation.slices || []).slice(0, 3).map((slice: any) => ({
    label: BUCKET_LABEL[slice.bucket as keyof typeof BUCKET_LABEL] ?? slice.bucket,
    value: formatCurrencyWholePtBr(slice.amount),
  }));
}

/** Rótulos do card de proventos do handoff (`divKpis`). */
function dividendMetrics(received: any): CopilotMetric[] {
  return compact([
    {label: 'Recebido 12M', value: formatCurrencyWholePtBr(received.total12m)},
    {label: 'Média mensal', value: formatCurrencyWholePtBr(received.total12m / 12)},
    isNumber(received.yieldOnCost)
      ? {label: 'Yield on cost', value: formatPctPtBr(received.yieldOnCost * 100)}
      : null,
  ]);
}

/**
 * Tiles de "Minha carteira está arriscada?" por nível, na ordem de
 * `CHAT[level].metrics` do handoff. Os números vêm de `/portfolio/returns`.
 */
function levelRiskMetrics(data: any, level: AdaptiveLevel, returns?: PortfolioReturns): CopilotMetric[] {
  const benchmark = returns?.benchmark;
  const risk = returns?.risk;

  if (level === 'iniciante') {
    const topAsset = data?.portfolioRisk?.concentrationByAsset?.[0];
    const topWeight = Number(topAsset?.weightPct ?? topAsset?.percentage);
    const totalValue = data?.portfolioSummary?.totalValue ?? returns?.contribution?.currentValue;
    return compact([
      isNumber(totalValue) ? {label: 'Você tem', value: formatCurrencyCompactPtBr(totalValue)} : null,
      isNumber(benchmark?.portfolioReturn)
        ? {label: 'Rendeu 12M', value: formatSignedPctPtBr(benchmark.portfolioReturn * 100)}
        : null,
      isNumber(topWeight) ? {label: 'Maior ativo', value: formatPctPtBr(topWeight, 1)} : null,
    ]);
  }

  if (level === 'intermediario') {
    return compact([
      isNumber(benchmark?.portfolioReturn)
        ? {label: 'Retorno 12M', value: formatSignedPctPtBr(benchmark.portfolioReturn * 100)}
        : null,
      isNumber(benchmark?.alpha)
        ? {label: 'Alpha vs IBOV', value: formatPpPtBr(benchmark.alpha * 100)}
        : null,
      isNumber(benchmark?.beta) ? {label: 'Beta', value: ptBr2(benchmark.beta)} : null,
    ]);
  }

  return compact([
    isNumber(risk?.valueAtRisk?.amount)
      ? {label: 'VaR 95% 21d', value: formatCurrencyCompactPtBr(risk.valueAtRisk.amount)}
      : null,
    isNumber(risk?.sharpe?.sharpe) ? {label: 'Sharpe', value: ptBr2(risk.sharpe.sharpe)} : null,
    isNumber(benchmark?.trackingError)
      ? {label: 'Tracking error', value: formatPctPtBr(benchmark.trackingError * 100, 1)}
      : null,
  ]);
}

/**
 * Tiles da bolha do Copiloto. O servidor manda frações; aqui viram o formato
 * do handoff (`+28,7%`, `+14,1 p.p.`, `0,86`).
 *
 * Lista vazia quando a resposta não tem análise com dado.
 */
export function buildCopilotMetrics(
  data: Record<string, unknown> | undefined,
  context: CopilotMetricContext = {},
): CopilotMetric[] {
  const payload = data as any;

  if (isNumber(payload?.correlationMatrix?.averageCorrelation)) {
    return correlationMetrics(payload.correlationMatrix);
  }
  if (isNumber(payload?.returnAttribution?.totalReturn)) {
    return attributionMetrics(payload.returnAttribution);
  }
  if (payload?.contributionSimulation?.slices?.length) {
    return contributionMetrics(payload.contributionSimulation);
  }
  if (isNumber(payload?.dividendsReceived?.total12m)) {
    return dividendMetrics(payload.dividendsReceived);
  }
  if (context.intent === 'allocation_gap' && payload?.rebalancing?.hasTarget) {
    return rebalancingMetrics(payload.rebalancing);
  }
  if (
    context.level &&
    (context.intent === 'portfolio_risk' || context.intent === 'portfolio_summary')
  ) {
    return levelRiskMetrics(payload, context.level, context.returns);
  }
  return [];
}
