import {AiAnalysisResult} from '@/services/ai';

export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';
export type InsightConfidence = 'low' | 'medium' | 'high';

export type InsightType =
  | 'priority_of_day'
  | 'investment_score_explanation'
  | 'trackerr_opinion'
  | 'if_you_act_today'
  | 'cost_of_inaction'
  | 'opportunity_radar'
  | 'hidden_risks'
  | 'auto_rebalance'
  | 'future_simulator'
  | 'portfolio_evolution'
  | 'tax_readiness';

export interface InsightAction {
  label: string;
  route?: string;
}

export interface ExpandedInsightAction {
  label: string;
  route?: string;
}

export interface ExpandedInsightPayload {
  id: string;
  title: string;
  type:
    | InsightType
    | 'scan_daily_impact'
    | 'scan_top_opportunity'
    | 'scan_top_risk'
    | 'scan_score_status'
    | 'scan_market_signal';
  severity: InsightSeverity;
  confidence: InsightConfidence;
  shortSummary: string;
  detailedExplanation: string[];
  deterministicFacts: string[];
  aiSynthesis: string | null;
  actionIfTaken: string | null;
  consequenceIfIgnored: string | null;
  relatedAssets: string[];
  relatedClasses: string[];
  suggestedActions: ExpandedInsightAction[];
  visualData?: {
    type: 'bar_comparison' | 'ranked_list' | 'scenario_table' | 'none';
    rows?: Array<{label: string; current?: number | null; target?: number | null; value?: number | null}>;
  };
  degradedState: boolean;
  unavailableReason: string | null;
}

export interface InsightCard {
  id: string;
  type: InsightType;
  title: string;
  severity: InsightSeverity;
  confidence: InsightConfidence;
  deterministicFacts: string[];
  aiSummary: string | null;
  primaryAction: InsightAction | null;
  consequenceIfAction: string | null;
  consequenceIfInaction: string | null;
  unavailableReason: string | null;
  referenceTimestamp: string;
}

export interface PortfolioInsightSnapshot {
  timestamp: string;
  diversificationScore: number | null;
  riskScore: number | null;
  topAssetConcentrationPct: number | null;
  internationalExposurePct: number | null;
  incomePredictabilityScore: number | null;
}

export interface InsightsV2Output {
  modelVersion: 'insights_v2';
  topPriority: InsightCard;
  secondary: InsightCard[];
  strategic: InsightCard[];
  simulation: InsightCard;
  cards: InsightCard[];
  expandedById: Record<string, ExpandedInsightPayload>;
  warnings: string[];
}

interface NormalizedAsset {
  symbol: string;
  type: string;
  sector: string | null;
  quantity: number;
  currentPrice: number;
  value: number;
}

interface BuildInsightsInput {
  assets: any[];
  analysis: AiAnalysisResult | null;
  fiscalSummary?: any | null;
  fiscalOptimizer?: any | null;
  now?: Date;
  previousSnapshot?: PortfolioInsightSnapshot | null;
}

interface OpportunityReasoning {
  symbol: string;
  rationale: string;
  caution: string;
  role: string | null;
}

export interface BuildScanExpandedInput {
  assets: any[];
  analysis: AiAnalysisResult | null;
  insights: InsightsV2Output;
  now?: Date;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toPercent = (value: number): string => `${value.toFixed(2)}%`;

function normalizeAssets(rawAssets: any[]): NormalizedAsset[] {
  return (rawAssets || [])
    .map((asset: any) => {
      const symbol = String(asset.symbol || asset.ticker || '').toUpperCase().trim();
      const type = String(asset.type || 'stock').toLowerCase();
      const quantity = Number(asset.quantity || asset.amount || 0);
      const currentPrice = Number(asset.current_price || asset.price || 0);
      const value = quantity * currentPrice;
      return {
        symbol,
        type,
        sector: asset?.sector ? String(asset.sector) : null,
        quantity,
        currentPrice,
        value,
      };
    })
    .filter((asset) => asset.symbol && Number.isFinite(asset.value) && asset.value > 0);
}

function resolveClass(type: string): 'equities' | 'fiis' | 'crypto' | 'fixed_income' | 'other' {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('fii')) return 'fiis';
  if (normalized.includes('crypto')) return 'crypto';
  if (
    normalized.includes('fixed') ||
    normalized.includes('renda_fixa') ||
    normalized.includes('renda fixa') ||
    normalized.includes('bond')
  ) {
    return 'fixed_income';
  }
  if (
    normalized.includes('stock') ||
    normalized.includes('acao') ||
    normalized.includes('ações') ||
    normalized.includes('equity') ||
    normalized.includes('etf') ||
    normalized.includes('bdr')
  ) {
    return 'equities';
  }
  return 'other';
}

function isLikelyInternational(asset: NormalizedAsset): boolean {
  const symbol = asset.symbol;
  return (
    symbol.endsWith('34') ||
    symbol.endsWith('39') ||
    symbol.includes('USD') ||
    symbol.includes('IVVB') ||
    asset.type.includes('crypto')
  );
}

function estimateIncomePredictability(assets: NormalizedAsset[]): number | null {
  if (!assets.length) return null;
  const incomeLike = assets.filter((asset) => {
    const normalized = asset.type;
    return normalized.includes('fii') || normalized.includes('fixed');
  });
  const total = assets.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return null;
  const incomeWeight = incomeLike.reduce((sum, item) => sum + item.value, 0) / total;
  return Math.round(clamp(incomeWeight * 100, 0, 100));
}

function buildDeterministicOpinion(input: {
  dominantClass: string;
  dominantClassPct: number;
  internationalExposurePct: number;
  topAssetPct: number;
  diversificationScore: number | null;
}): string {
  const pieces: string[] = [];
  pieces.push(
    `Sua carteira está concentrada em ${input.dominantClass.toLowerCase()} (${toPercent(input.dominantClassPct)}).`,
  );

  if (input.internationalExposurePct < 10) {
    pieces.push('A exposição internacional ainda é baixa para reduzir risco de um único mercado.');
  }

  if (input.topAssetPct >= 20) {
    pieces.push(`Há concentração relevante no principal ativo (${toPercent(input.topAssetPct)}).`);
  }

  if (typeof input.diversificationScore === 'number') {
    pieces.push(`A diversificação atual está em ${input.diversificationScore}/100.`);
  }

  return pieces.join(' ');
}

function scoreToSeverity(score: number | null): InsightSeverity {
  if (score === null) return 'medium';
  if (score < 35) return 'critical';
  if (score < 55) return 'high';
  if (score < 75) return 'medium';
  return 'low';
}

function buildOpportunityReasoning(input: {
  opportunities: any[];
  assets: NormalizedAsset[];
}): OpportunityReasoning[] {
  const total = input.assets.reduce((sum, item) => sum + item.value, 0);
  const allocationBySymbol = new Map(
    input.assets.map((asset) => [asset.symbol, (asset.value / (total || 1)) * 100]),
  );

  return (input.opportunities || []).slice(0, 3).map((item: any) => {
    const symbol = String(item.symbol || '').toUpperCase();
    const upside = Number(item.upside || 0);
    const allocation = allocationBySymbol.get(symbol) || 0;

    const caution =
      allocation >= 15
        ? `${symbol} já representa ${toPercent(allocation)} da carteira; limitar aumento de posição.`
        : upside >= 20
          ? 'Upside elevado tende a ter maior incerteza de execução; ajustar tamanho de posição.'
          : 'Validar tese com cenário macro e risco setorial antes de entrada.';

    const role =
      allocation < 5
        ? 'Posição satélite para diversificação de tese.'
        : allocation < 12
          ? 'Posição tática com limite de peso.'
          : null;

    return {
      symbol,
      rationale:
        String(item.rationale || '').trim() ||
        `Oportunidade detectada para ${symbol} com upside estimado de ${upside.toFixed(1)}%.`,
      caution,
      role,
    };
  });
}

function calculateProjection(params: {
  currentValue: number;
  monthlyContribution: number;
  years: number;
  annualReturnPct: number;
}): number {
  const months = Math.max(1, Math.round(params.years * 12));
  const monthlyRate = Math.pow(1 + params.annualReturnPct, 1 / 12) - 1;
  let portfolio = params.currentValue;
  for (let i = 0; i < months; i += 1) {
    portfolio = portfolio * (1 + monthlyRate) + params.monthlyContribution;
  }
  return Number(portfolio.toFixed(2));
}

function compareSnapshot(
  current: PortfolioInsightSnapshot,
  previous: PortfolioInsightSnapshot | null,
  timestamp: string,
): InsightCard {
  if (!previous) {
    return {
      id: 'portfolio-evolution',
      type: 'portfolio_evolution',
      title: 'Evolução da carteira desde a última revisão',
      severity: 'low',
      confidence: 'low',
      deterministicFacts: ['Sem histórico suficiente para comparar evolução com segurança.'],
      aiSummary: null,
      primaryAction: null,
      consequenceIfAction: null,
      consequenceIfInaction: null,
      unavailableReason: 'no_history_snapshot_available',
      referenceTimestamp: timestamp,
    };
  }

  const changes: string[] = [];

  if (
    typeof current.diversificationScore === 'number' &&
    typeof previous.diversificationScore === 'number'
  ) {
    const delta = Number((current.diversificationScore - previous.diversificationScore).toFixed(1));
    changes.push(
      delta >= 0
        ? `Diversificação melhorou em ${delta.toFixed(1)} pontos.`
        : `Diversificação piorou em ${Math.abs(delta).toFixed(1)} pontos.`,
    );
  }

  if (
    typeof current.topAssetConcentrationPct === 'number' &&
    typeof previous.topAssetConcentrationPct === 'number'
  ) {
    const delta = Number((current.topAssetConcentrationPct - previous.topAssetConcentrationPct).toFixed(2));
    changes.push(
      delta <= 0
        ? `Concentração no maior ativo caiu ${Math.abs(delta).toFixed(2)} p.p.`
        : `Concentração no maior ativo subiu ${delta.toFixed(2)} p.p.`,
    );
  }

  if (
    typeof current.internationalExposurePct === 'number' &&
    typeof previous.internationalExposurePct === 'number'
  ) {
    const delta = Number((current.internationalExposurePct - previous.internationalExposurePct).toFixed(2));
    changes.push(
      delta >= 0
        ? `Exposição internacional aumentou ${delta.toFixed(2)} p.p.`
        : `Exposição internacional reduziu ${Math.abs(delta).toFixed(2)} p.p.`,
    );
  }

  if (!changes.length) {
    changes.push('Não há sinais suficientes para inferir melhora ou piora com confiança.');
  }

  return {
    id: 'portfolio-evolution',
    type: 'portfolio_evolution',
    title: 'Evolução da carteira desde a última revisão',
    severity: 'medium',
    confidence: changes.length >= 2 ? 'high' : 'medium',
    deterministicFacts: changes.slice(0, 3),
    aiSummary: null,
    primaryAction: {
      label: 'Revisar histórico da carteira',
      route: '/portfolio',
    },
    consequenceIfAction: 'Você valida se o portfólio está evoluindo na direção desejada.',
    consequenceIfInaction: 'Mudanças de risco e concentração podem passar despercebidas.',
    unavailableReason: null,
    referenceTimestamp: timestamp,
  };
}

export function buildPortfolioInsightSnapshot(params: {
  diversificationScore: number | null;
  riskScore: number | null;
  topAssetConcentrationPct: number | null;
  internationalExposurePct: number | null;
  incomePredictabilityScore: number | null;
  now?: Date;
}): PortfolioInsightSnapshot {
  const now = params.now || new Date();
  return {
    timestamp: now.toISOString(),
    diversificationScore: params.diversificationScore,
    riskScore: params.riskScore,
    topAssetConcentrationPct: params.topAssetConcentrationPct,
    internationalExposurePct: params.internationalExposurePct,
    incomePredictabilityScore: params.incomePredictabilityScore,
  };
}

export function buildInsightsV2(input: BuildInsightsInput): InsightsV2Output {
  const now = input.now || new Date();
  const timestamp = now.toISOString();
  const assets = normalizeAssets(input.assets);
  const aiData = input.analysis?.ai_analysis || input.analysis;
  const warnings: string[] = [];

  const totalValue = assets.reduce((sum, item) => sum + item.value, 0);
  const allocationsByClass = assets.reduce<Record<string, number>>((acc, item) => {
    const key = resolveClass(item.type);
    acc[key] = (acc[key] || 0) + item.value;
    return acc;
  }, {});

  const classRows = Object.entries(allocationsByClass)
    .map(([key, value]) => ({
      key,
      value,
      pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.pct - a.pct);

  const dominantClass = classRows[0]?.key || 'Sem classe dominante';
  const dominantClassPct = classRows[0]?.pct || 0;

  const topAsset = assets
    .slice()
    .sort((a, b) => b.value - a.value)[0];
  const topAssetPct = topAsset && totalValue > 0 ? (topAsset.value / totalValue) * 100 : 0;

  const internationalValue = assets
    .filter((asset) => isLikelyInternational(asset))
    .reduce((sum, asset) => sum + asset.value, 0);
  const internationalExposurePct = totalValue > 0 ? (internationalValue / totalValue) * 100 : 0;

  const score = aiData?.investment_score;
  const diversificationScore =
    typeof score?.diversification === 'number' ? score.diversification : null;
  const riskScore = typeof score?.risk === 'number' ? score.risk : null;
  const consistencyScore = typeof score?.consistency === 'number' ? score.consistency : null;
  const volatilityScore = typeof score?.volatility === 'number' ? score.volatility : null;

  const scoreRows = [
    {label: 'Diversificação', value: diversificationScore},
    {label: 'Consistência', value: consistencyScore},
    {label: 'Risco', value: riskScore},
    {label: 'Volatilidade', value: volatilityScore},
  ].filter((item) => typeof item.value === 'number') as Array<{label: string; value: number}>;

  const strongest = scoreRows.slice().sort((a, b) => b.value - a.value)[0] || null;
  const weakest = scoreRows.slice().sort((a, b) => a.value - b.value)[0] || null;

  const scoreAction = weakest
    ? weakest.label === 'Diversificação'
      ? 'Aumentar exposição em classe/submercado sub-representado em 5-10 p.p.'
      : weakest.label === 'Risco'
        ? 'Reduzir concentração em ativos com maior peso para baixar risco específico.'
        : weakest.label === 'Volatilidade'
          ? 'Adicionar componente defensivo para estabilizar oscilação da carteira.'
          : 'Reforçar disciplina de aportes para elevar consistência da carteira.'
    : 'Sem dados suficientes para recomendar ajuste de score.';

  const scoreCard: InsightCard = {
    id: 'investment-score-explanation',
    type: 'investment_score_explanation',
    title: 'Investment Score com drivers acionáveis',
    severity: scoreToSeverity(score?.overall ?? null),
    confidence: scoreRows.length >= 3 ? 'high' : 'medium',
    deterministicFacts: [
      `Score atual: ${typeof score?.overall === 'number' ? score.overall : 'N/D'}.`,
      strongest ? `Maior força: ${strongest.label} (${strongest.value}).` : 'Maior força indisponível.',
      weakest ? `Maior fragilidade: ${weakest.label} (${weakest.value}).` : 'Maior fragilidade indisponível.',
      `Próxima melhor ação: ${scoreAction}`,
    ],
    aiSummary: null,
    primaryAction: {label: 'Ver composição da carteira', route: '/portfolio'},
    consequenceIfAction: 'A tendência é melhorar o score nos componentes mais fracos.',
    consequenceIfInaction: 'Os pontos fracos continuam pressionando a qualidade da carteira.',
    unavailableReason: score ? null : 'investment_score_not_available',
    referenceTimestamp: timestamp,
  };

  const deterministicOpinion = buildDeterministicOpinion({
    dominantClass,
    dominantClassPct,
    internationalExposurePct,
    topAssetPct,
    diversificationScore,
  });

  const opinionCard: InsightCard = {
    id: 'trackerr-opinion',
    type: 'trackerr_opinion',
    title: 'Leitura da carteira',
    severity: topAssetPct >= 25 || internationalExposurePct < 10 ? 'high' : 'medium',
    confidence: assets.length > 0 ? 'high' : 'low',
    deterministicFacts: [deterministicOpinion],
    aiSummary: String(aiData?.portfolio_assessment || '').trim() || null,
    primaryAction: {label: 'Abrir análise detalhada', route: '/portfolio'},
    consequenceIfAction: null,
    consequenceIfInaction: null,
    unavailableReason: assets.length ? null : 'portfolio_assets_not_available',
    referenceTimestamp: timestamp,
  };

  const hiddenRiskSignals: Array<{message: string; severity: InsightSeverity; score: number}> = [];
  if (topAssetPct >= 20) {
    hiddenRiskSignals.push({
      message: `Concentração elevada no principal ativo (${toPercent(topAssetPct)}).`,
      severity: topAssetPct >= 30 ? 'critical' : 'high',
      score: topAssetPct,
    });
  }
  if (dominantClassPct >= 65) {
    hiddenRiskSignals.push({
      message: `Dependência alta de ${dominantClass.toLowerCase()} (${toPercent(dominantClassPct)}).`,
      severity: dominantClassPct >= 80 ? 'critical' : 'high',
      score: dominantClassPct - 10,
    });
  }
  if (internationalExposurePct < 10) {
    hiddenRiskSignals.push({
      message: `Exposição internacional baixa (${toPercent(internationalExposurePct)}).`,
      severity: internationalExposurePct < 5 ? 'high' : 'medium',
      score: 60 - internationalExposurePct,
    });
  }
  if (classRows.length < 3) {
    hiddenRiskSignals.push({
      message: `Baixa diversidade de classes (${classRows.length} classe(s) com posição relevante).`,
      severity: classRows.length <= 1 ? 'high' : 'medium',
      score: 55,
    });
  }
  const incomePredictabilityScore = estimateIncomePredictability(assets);
  if (typeof incomePredictabilityScore === 'number' && incomePredictabilityScore < 35) {
    hiddenRiskSignals.push({
      message: `Previsibilidade de renda ainda baixa (${incomePredictabilityScore}/100).`,
      severity: 'medium',
      score: 45,
    });
  }

  const hiddenRisksCard: InsightCard = {
    id: 'hidden-risks',
    type: 'hidden_risks',
    title: 'Riscos ocultos priorizados',
    severity: hiddenRiskSignals.some((item) => item.severity === 'critical')
      ? 'critical'
      : hiddenRiskSignals.some((item) => item.severity === 'high')
        ? 'high'
        : 'medium',
    confidence: assets.length > 0 ? 'high' : 'low',
    deterministicFacts: hiddenRiskSignals
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.message),
    aiSummary: null,
    primaryAction: {label: 'Revisar concentração', route: '/portfolio'},
    consequenceIfAction: 'Você reduz exposição a riscos silenciosos que afetam estabilidade da carteira.',
    consequenceIfInaction: 'A carteira permanece sensível a choques de poucos ativos/classe.',
    unavailableReason: hiddenRiskSignals.length ? null : 'hidden_risks_not_detected',
    referenceTimestamp: timestamp,
  };

  const opportunityReasoning = buildOpportunityReasoning({
    opportunities: aiData?.opportunity_radar || [],
    assets,
  });

  const opportunityCard: InsightCard = {
    id: 'opportunity-radar',
    type: 'opportunity_radar',
    title: 'Radar de oportunidades com tese e cautela',
    severity: opportunityReasoning.length ? 'medium' : 'low',
    confidence: opportunityReasoning.length ? 'medium' : 'low',
    deterministicFacts: opportunityReasoning.length
      ? opportunityReasoning.flatMap((item) => {
          const lines = [`${item.symbol}: ${item.rationale}`, `Cautela: ${item.caution}`];
          if (item.role) lines.push(`Papel sugerido: ${item.role}`);
          return lines;
        })
      : ['Nenhuma oportunidade segura foi identificada com os dados atuais.'],
    aiSummary: null,
    primaryAction: {label: 'Comparar ativos', route: '/comparator'},
    consequenceIfAction: opportunityReasoning.length
      ? 'A decisão considera tese e limite de risco por posição.'
      : null,
    consequenceIfInaction: opportunityReasoning.length
      ? 'Você pode perder janela tática, mas evita entrada sem tese validada.'
      : null,
    unavailableReason: opportunityReasoning.length ? null : 'no_opportunities_available',
    referenceTimestamp: timestamp,
  };

  const idealAllocation = (aiData?.rebalancing?.ideal_allocation || []) as Array<{
    category: string;
    current: number;
    ideal: number;
  }>;
  const largestDrift = idealAllocation
    .map((item) => ({...item, drift: Number((item.ideal - item.current).toFixed(2))}))
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))[0];

  const rebalanceCard: InsightCard = {
    id: 'auto-rebalance',
    type: 'auto_rebalance',
    title: 'Auto rebalanceamento com consequência',
    severity: largestDrift && Math.abs(largestDrift.drift) >= 10 ? 'high' : 'medium',
    confidence: largestDrift ? 'high' : 'low',
    deterministicFacts: largestDrift
      ? [
          `Maior desvio: ${largestDrift.category} em ${Math.abs(largestDrift.drift).toFixed(2)} p.p. da alocação ideal.`,
          `Ajuste alvo: de ${largestDrift.current.toFixed(1)}% para ${largestDrift.ideal.toFixed(1)}%.`,
        ]
      : ['Sem dados de rebalanceamento para estimar consequência no momento.'],
    aiSummary: null,
    primaryAction: {label: 'Aplicar ajustes no planejamento', route: '/planning'},
    consequenceIfAction: largestDrift
      ? 'Tende a reduzir concentração e melhorar estabilidade da carteira.'
      : null,
    consequenceIfInaction: largestDrift
      ? 'O desvio da alocação ideal permanece e o risco estrutural não reduz.'
      : null,
    unavailableReason: largestDrift ? null : 'rebalance_inputs_unavailable',
    referenceTimestamp: timestamp,
  };

  const topTaxOpportunity = (input.fiscalOptimizer?.opportunities || [])
    .slice()
    .sort((a: any, b: any) => Number(b.taxSaved || 0) - Number(a.taxSaved || 0))[0];

  const taxReadinessCard: InsightCard = {
    id: 'tax-readiness',
    type: 'tax_readiness',
    title: 'AI Tax Readiness',
    severity: topTaxOpportunity ? 'high' : 'low',
    confidence: input.fiscalOptimizer || input.fiscalSummary ? 'medium' : 'low',
    deterministicFacts: topTaxOpportunity
      ? [
          `${topTaxOpportunity.symbol}: potencial de economia estimada de R$ ${Number(topTaxOpportunity.taxSaved || 0).toFixed(2).replace('.', ',')}.`,
          'Simular venda antes de executar para confirmar impacto fiscal.',
        ]
      : ['Nenhuma ação fiscal imediata foi detectada com os dados disponíveis.'],
    aiSummary: null,
    primaryAction: {label: 'Abrir página Fiscal', route: '/fiscal'},
    consequenceIfAction: topTaxOpportunity
      ? 'Você pode reduzir imposto desnecessário com simulação prévia.'
      : 'Você confirma que não há gatilho fiscal urgente hoje.',
    consequenceIfInaction: topTaxOpportunity
      ? 'A oportunidade de compensação tributária pode ser perdida.'
      : null,
    unavailableReason: input.fiscalOptimizer || input.fiscalSummary ? null : 'tax_signals_unavailable',
    referenceTimestamp: timestamp,
  };

  const currentValue = totalValue;
  const estimatedMonthlyIncome = currentValue * 0.004;
  const futureFacts = [
    {
      label: 'Aporte de R$ 500/mês',
      value: calculateProjection({
        currentValue,
        monthlyContribution: 500,
        years: 10,
        annualReturnPct: 0.08,
      }),
    },
    {
      label: 'Aporte de R$ 1.000/mês',
      value: calculateProjection({
        currentValue,
        monthlyContribution: 1000,
        years: 10,
        annualReturnPct: 0.08,
      }),
    },
    {
      label: 'Rebalancear antes e aportar R$ 1.000/mês',
      value: calculateProjection({
        currentValue,
        monthlyContribution: 1000,
        years: 10,
        annualReturnPct: 0.085,
      }),
    },
    {
      label: 'Reinvestir dividendos (estimativa)',
      value: calculateProjection({
        currentValue,
        monthlyContribution: 1000 + estimatedMonthlyIncome,
        years: 10,
        annualReturnPct: 0.08,
      }),
    },
    {
      label: 'Adicionar ETF internacional (+10 p.p.)',
      value: calculateProjection({
        currentValue,
        monthlyContribution: 1000,
        years: 10,
        annualReturnPct: 0.082,
      }),
    },
  ];

  const futureCard: InsightCard = {
    id: 'future-simulator',
    type: 'future_simulator',
    title: 'Cenários guiados de futuro',
    severity: 'medium',
    confidence: currentValue > 0 ? 'medium' : 'low',
    deterministicFacts:
      currentValue > 0
        ? futureFacts.map(
            (scenario) => `${scenario.label}: R$ ${scenario.value.toFixed(2).replace('.', ',')}.`,
          )
        : ['Sem base de carteira para projetar cenários.'],
    aiSummary: null,
    primaryAction: {label: 'Abrir simulador', route: '/planning'},
    consequenceIfAction: 'Você toma decisão com cenários comparáveis antes de executar.',
    consequenceIfInaction: 'A decisão segue sem visão clara de impacto de longo prazo.',
    unavailableReason: currentValue > 0 ? null : 'future_simulation_inputs_unavailable',
    referenceTimestamp: timestamp,
  };

  const currentSnapshot = buildPortfolioInsightSnapshot({
    diversificationScore,
    riskScore,
    topAssetConcentrationPct: topAssetPct,
    internationalExposurePct,
    incomePredictabilityScore,
    now,
  });

  const evolutionCard = compareSnapshot(currentSnapshot, input.previousSnapshot || null, timestamp);

  const priorityCandidates: Array<{card: InsightCard; rank: number}> = [
    {
      card: {
        id: 'priority-concentration',
        type: 'priority_of_day',
        title:
          topAssetPct >= 25
            ? 'Prioridade do dia: reduzir concentração do principal ativo'
            : internationalExposurePct < 10
              ? 'Prioridade do dia: aumentar diversificação internacional'
              : topTaxOpportunity
                ? `Prioridade do dia: simular venda de ${topTaxOpportunity.symbol}`
                : 'Prioridade do dia: nenhuma ação urgente identificada',
        severity:
          topAssetPct >= 30
            ? 'critical'
            : topAssetPct >= 25 || internationalExposurePct < 6 || topTaxOpportunity
              ? 'high'
              : 'low',
        confidence: assets.length ? 'high' : 'low',
        deterministicFacts:
          topAssetPct >= 25
            ? [
                `${topAsset?.symbol || 'Principal ativo'} concentra ${toPercent(topAssetPct)} da carteira.`,
                'Concentração elevada aumenta risco específico sem melhora proporcional de diversificação.',
              ]
            : internationalExposurePct < 10
              ? [
                  `Exposição internacional atual em ${toPercent(internationalExposurePct)}.`,
                  'A carteira segue dependente de um único mercado local.',
                ]
              : topTaxOpportunity
                ? [
                    `${topTaxOpportunity.symbol} apresenta oportunidade fiscal relevante.`,
                    `Economia estimada: R$ ${Number(topTaxOpportunity.taxSaved || 0).toFixed(2).replace('.', ',')}.`,
                  ]
                : ['Com os dados atuais, não há gatilho crítico para hoje.'],
        aiSummary: null,
        primaryAction:
          topAssetPct >= 25
            ? {label: 'Revisar alocação por ativo', route: '/portfolio'}
            : internationalExposurePct < 10
              ? {label: 'Simular alocação internacional', route: '/planning'}
              : topTaxOpportunity
                ? {label: 'Abrir simulação fiscal', route: '/fiscal'}
                : null,
        consequenceIfAction:
          topAssetPct >= 25
            ? 'A concentração de risco tende a cair já no curto prazo.'
            : internationalExposurePct < 10
              ? 'A carteira ganha proteção contra concentração geográfica.'
              : topTaxOpportunity
                ? 'Você confirma eficiência tributária antes de executar venda.'
                : null,
        consequenceIfInaction:
          topAssetPct >= 25
            ? 'A carteira segue vulnerável a um evento isolado no ativo dominante.'
            : internationalExposurePct < 10
              ? 'A carteira permanece sensível ao mesmo regime local.'
              : topTaxOpportunity
                ? 'A oportunidade fiscal pode expirar sem captura.'
                : null,
        unavailableReason: null,
        referenceTimestamp: timestamp,
      },
      rank:
        topAssetPct >= 30
          ? 100
          : topAssetPct >= 25
            ? 92
            : internationalExposurePct < 6
              ? 89
              : topTaxOpportunity
                ? 84
                : 45,
    },
  ];

  const topPriority = priorityCandidates.sort((a, b) => b.rank - a.rank)[0].card;

  const actionCard: InsightCard = {
    id: 'if-you-act-today',
    type: 'if_you_act_today',
    title: 'Se você agir hoje',
    severity: topPriority.severity,
    confidence: topPriority.confidence,
    deterministicFacts: [
      topPriority.primaryAction
        ? `Ação sugerida: ${topPriority.primaryAction.label}.`
        : 'Nenhuma ação obrigatória foi detectada hoje.',
    ],
    aiSummary: null,
    primaryAction: topPriority.primaryAction,
    consequenceIfAction:
      topPriority.consequenceIfAction ||
      'Você tende a reduzir risco estrutural e melhorar a qualidade da carteira.',
    consequenceIfInaction: null,
    unavailableReason: null,
    referenceTimestamp: timestamp,
  };

  const inactionCard: InsightCard = {
    id: 'cost-of-inaction',
    type: 'cost_of_inaction',
    title: 'Custo de não agir',
    severity: topPriority.severity,
    confidence: topPriority.confidence,
    deterministicFacts: [
      topPriority.consequenceIfInaction ||
        'No cenário atual, o custo de inação é baixo com os dados disponíveis.',
    ],
    aiSummary: null,
    primaryAction: topPriority.primaryAction,
    consequenceIfAction: null,
    consequenceIfInaction:
      topPriority.consequenceIfInaction ||
      'Sem impacto crítico identificado até o momento.',
    unavailableReason: null,
    referenceTimestamp: timestamp,
  };

  if (!input.fiscalSummary && !input.fiscalOptimizer) {
    warnings.push('fiscal_signals_unavailable');
  }
  if (!input.previousSnapshot) {
    warnings.push('portfolio_history_unavailable');
  }
  if (!opportunityReasoning.length) {
    warnings.push('opportunity_candidates_unavailable');
  }

  const cards = [
    topPriority,
    scoreCard,
    opinionCard,
    actionCard,
    inactionCard,
    hiddenRisksCard,
    opportunityCard,
    rebalanceCard,
    evolutionCard,
    taxReadinessCard,
    futureCard,
  ];

  const secondary = [scoreCard, actionCard, inactionCard, hiddenRisksCard].slice(0, 4);
  const strategic = [opportunityCard, rebalanceCard, evolutionCard, taxReadinessCard].slice(0, 4);
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const expandedById: Record<string, ExpandedInsightPayload> = {};
  const addExpanded = (payload: ExpandedInsightPayload) => {
    expandedById[payload.id] = payload;
  };

  const defaultExpandedFromCard = (card: InsightCard): ExpandedInsightPayload => ({
    id: card.id,
    title: card.title,
    type: card.type,
    severity: card.severity,
    confidence: card.confidence,
    shortSummary: card.deterministicFacts[0] || 'Sem resumo disponível.',
    detailedExplanation: [
      'Este insight foi ativado por sinais estruturados da carteira.',
      'A recomendação prioriza clareza entre impacto de agir e custo de inação.',
    ],
    deterministicFacts: card.deterministicFacts,
    aiSynthesis: card.aiSummary,
    actionIfTaken: card.consequenceIfAction,
    consequenceIfIgnored: card.consequenceIfInaction,
    relatedAssets: [],
    relatedClasses: [],
    suggestedActions: card.primaryAction ? [card.primaryAction] : [],
    visualData: {
      type: 'none',
    },
    degradedState: Boolean(card.unavailableReason),
    unavailableReason: card.unavailableReason,
  });

  for (const card of cards) {
    addExpanded(defaultExpandedFromCard(card));
  }

  const scoreCardRef = cardById.get('investment-score-explanation');
  if (scoreCardRef) {
    addExpanded({
      ...expandedById[scoreCardRef.id],
      detailedExplanation: [
        'O score combina diversificação, consistência, risco e volatilidade.',
        'A maior fragilidade atual define a ação com maior impacto marginal no score.',
      ],
      relatedClasses: classRows.map((row) => row.key).slice(0, 4),
      visualData: {
        type: 'bar_comparison',
        rows: [
          {label: 'Diversificação', value: diversificationScore},
          {label: 'Risco', value: riskScore},
          {label: 'Consistência', value: consistencyScore},
          {label: 'Volatilidade', value: volatilityScore},
        ],
      },
    });
  }

  const hiddenCardRef = cardById.get('hidden-risks');
  if (hiddenCardRef) {
    addExpanded({
      ...expandedById[hiddenCardRef.id],
      detailedExplanation: [
        'Riscos ocultos são sinais não óbvios que podem degradar a carteira sem gatilho explícito.',
        'O ranking prioriza concentração, dependência de classe e exposição geográfica.',
      ],
      relatedAssets: topAsset ? [topAsset.symbol] : [],
      relatedClasses: classRows.map((row) => row.key).slice(0, 3),
      visualData: {
        type: 'ranked_list',
        rows: hiddenRiskSignals
          .slice()
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((risk, idx) => ({
            label: `${idx + 1}. ${risk.message}`,
            value: risk.score,
          })),
      },
    });
  }

  const rebalanceCardRef = cardById.get('auto-rebalance');
  if (rebalanceCardRef) {
    addExpanded({
      ...expandedById[rebalanceCardRef.id],
      detailedExplanation: [
        'A comparação atual x ideal destaca os desvios com maior impacto de risco.',
        'A ação sugerida prioriza reduzir concentração sem perder coerência de estratégia.',
      ],
      relatedClasses: idealAllocation.map((item) => item.category),
      visualData: {
        type: 'bar_comparison',
        rows: idealAllocation.slice(0, 8).map((item) => ({
          label: item.category,
          current: item.current,
          target: item.ideal,
        })),
      },
    });
  }

  const opportunityCardRef = cardById.get('opportunity-radar');
  if (opportunityCardRef) {
    addExpanded({
      ...expandedById[opportunityCardRef.id],
      detailedExplanation: [
        'Cada oportunidade aparece com tese e risco de invalidação para evitar viés de confirmação.',
        'A priorização considera potencial e encaixe no contexto da carteira.',
      ],
      relatedAssets: opportunityReasoning.map((item) => item.symbol),
      suggestedActions: [
        {label: 'Comparar ativos', route: '/comparator'},
        {label: 'Abrir carteira', route: '/portfolio'},
      ],
      visualData: {
        type: 'ranked_list',
        rows: opportunityReasoning.map((item, index) => ({
          label: `${index + 1}. ${item.symbol} - ${item.rationale}`,
          value: index + 1,
        })),
      },
      degradedState: !opportunityReasoning.length,
      unavailableReason:
        opportunityReasoning.length > 0
          ? null
          : 'opportunity_details_unavailable',
    });
  }

  const futureCardRef = cardById.get('future-simulator');
  if (futureCardRef) {
    addExpanded({
      ...expandedById[futureCardRef.id],
      detailedExplanation: [
        'Os cenários são guias para decisão e não promessa de retorno.',
        'A comparação entre cenários evidencia sensibilidade de aportes e alocação.',
      ],
      suggestedActions: [
        {label: 'Abrir planejamento', route: '/planning'},
        {label: 'Revisar rebalanceamento', route: '/planning'},
      ],
      visualData: {
        type: 'scenario_table',
        rows: futureFacts.map((item) => ({
          label: item.label,
          value: item.value,
        })),
      },
    });
  }

  const taxCardRef = cardById.get('tax-readiness');
  if (taxCardRef) {
    addExpanded({
      ...expandedById[taxCardRef.id],
      detailedExplanation: [
        'O bloco fiscal na Insights é um gatilho de atenção, não substitui a apuração completa.',
        'A recomendação prioriza simulação antes de venda quando há oportunidade relevante.',
      ],
      relatedAssets: topTaxOpportunity?.symbol ? [String(topTaxOpportunity.symbol)] : [],
      suggestedActions: [
        {label: 'Abrir página Fiscal', route: '/fiscal'},
      ],
      degradedState: !(input.fiscalOptimizer || input.fiscalSummary),
      unavailableReason:
        input.fiscalOptimizer || input.fiscalSummary
          ? null
          : 'tax_detail_unavailable',
    });
  }

  return {
    modelVersion: 'insights_v2',
    topPriority,
    secondary,
    strategic,
    simulation: futureCard,
    cards,
    expandedById,
    warnings,
  };
}

export function buildScanExpandedPayloads(
  input: BuildScanExpandedInput,
): Record<
  | 'scan_daily_impact'
  | 'scan_top_opportunity'
  | 'scan_top_risk'
  | 'scan_score_status'
  | 'scan_market_signal',
  ExpandedInsightPayload
> {
  const now = input.now || new Date();
  const timestamp = now.toISOString();
  const assets = normalizeAssets(input.assets);
  const totalValue = assets.reduce((sum, item) => sum + item.value, 0);
  const aiData = input.analysis?.ai_analysis || input.analysis;

  const dailyImpact = (input.assets || []).reduce((sum: number, asset: any) => {
    const price = Number(asset?.current_price || asset?.price || 0);
    const quantity = Number(asset?.quantity || 0);
    const change24h = Number(asset?.change_24h || asset?.change24h || 0);
    if (!Number.isFinite(price) || !Number.isFinite(quantity) || !Number.isFinite(change24h)) {
      return sum;
    }
    return sum + price * quantity * (change24h / 100);
  }, 0);

  const opportunity = ((aiData?.opportunity_radar || []) as any[])
    .slice()
    .sort((a, b) => Number(b?.upside || 0) - Number(a?.upside || 0))[0];
  const topRisk =
    String((aiData?.error_detection || [])[0]?.message || '').trim() ||
    (Number(aiData?.investment_score?.risk || 0) >= 70
      ? 'Score de risco elevado requer revisão de concentração.'
      : 'Sem risco crítico identificado.');

  const topAsset = assets
    .slice()
    .sort((a, b) => b.value - a.value)[0];
  const internationalValue = assets
    .filter((asset) => isLikelyInternational(asset))
    .reduce((sum, item) => sum + item.value, 0);
  const internationalPct = totalValue > 0 ? (internationalValue / totalValue) * 100 : null;

  return {
    scan_daily_impact: {
      id: 'scan_daily_impact',
      title: 'Impacto Diário',
      type: 'scan_daily_impact',
      severity: dailyImpact < 0 ? 'high' : 'medium',
      confidence: assets.length ? 'medium' : 'low',
      shortSummary:
        `Impacto estimado de ${dailyImpact >= 0 ? '+' : '-'}R$ ${Math.abs(dailyImpact).toFixed(2)} no dia.`,
      detailedExplanation: [
        'Este indicador estima o efeito agregado da variação diária sobre posições atuais.',
        'Use como sinal de monitoramento e não como decisão isolada de compra/venda.',
      ],
      deterministicFacts: [
        `Patrimônio analisado: R$ ${totalValue.toFixed(2)}.`,
        `Principal ativo em peso: ${topAsset?.symbol || 'indisponível'}.`,
      ],
      aiSynthesis: null,
      actionIfTaken: 'Revisar os principais contribuintes e validar se o movimento é ruído ou mudança estrutural.',
      consequenceIfIgnored: 'Você pode perder sinais de deterioração ou oportunidade tática no curto prazo.',
      relatedAssets: topAsset?.symbol ? [topAsset.symbol] : [],
      relatedClasses: [],
      suggestedActions: [
        {label: 'Abrir carteira', route: '/portfolio'},
      ],
      visualData: {
        type: 'none',
      },
      degradedState: assets.length === 0,
      unavailableReason: assets.length === 0 ? 'daily_impact_inputs_unavailable' : null,
    },
    scan_top_opportunity: {
      id: 'scan_top_opportunity',
      title: 'Top Oportunidade',
      type: 'scan_top_opportunity',
      severity: opportunity ? 'medium' : 'low',
      confidence: opportunity ? 'medium' : 'low',
      shortSummary: opportunity
        ? `${String(opportunity.symbol).toUpperCase()} com upside estimado de ${Number(opportunity.upside || 0).toFixed(1)}%.`
        : 'Sem oportunidade segura com os dados atuais.',
      detailedExplanation: [
        'A oportunidade é selecionada por potencial e contexto de carteira.',
        'A decisão final deve considerar tese, risco de invalidação e limite de peso.',
      ],
      deterministicFacts: [
        String(opportunity?.rationale || 'Racional indisponível.'),
      ],
      aiSynthesis: null,
      actionIfTaken: 'Comparar o ativo com alternativas e definir tamanho máximo de posição.',
      consequenceIfIgnored: 'Você pode perder uma janela tática, mantendo coerência com risco atual.',
      relatedAssets: opportunity?.symbol ? [String(opportunity.symbol).toUpperCase()] : [],
      relatedClasses: [],
      suggestedActions: [
        {label: 'Comparar ativos', route: '/comparator'},
      ],
      visualData: {
        type: 'none',
      },
      degradedState: !opportunity,
      unavailableReason: opportunity ? null : 'top_opportunity_unavailable',
    },
    scan_top_risk: {
      id: 'scan_top_risk',
      title: 'Top Risco',
      type: 'scan_top_risk',
      severity: Number(aiData?.investment_score?.risk || 0) >= 70 ? 'high' : 'medium',
      confidence: assets.length ? 'medium' : 'low',
      shortSummary: topRisk,
      detailedExplanation: [
        'Este risco reflete o principal ponto de fragilidade estrutural visível no momento.',
        'A correção costuma passar por ajuste de concentração e diversificação.',
      ],
      deterministicFacts: input.insights.cards.find((card) => card.type === 'hidden_risks')?.deterministicFacts || [topRisk],
      aiSynthesis: null,
      actionIfTaken: 'Aplicar plano de mitigação com foco no driver principal do risco.',
      consequenceIfIgnored: 'A carteira segue vulnerável ao mesmo fator de estresse.',
      relatedAssets: topAsset?.symbol ? [topAsset.symbol] : [],
      relatedClasses: [],
      suggestedActions: [
        {label: 'Revisar concentração', route: '/portfolio'},
      ],
      visualData: {
        type: 'ranked_list',
        rows: (input.insights.cards.find((card) => card.type === 'hidden_risks')?.deterministicFacts || [])
          .slice(0, 5)
          .map((item, index) => ({
            label: `${index + 1}. ${item}`,
            value: index + 1,
          })),
      },
      degradedState: !assets.length,
      unavailableReason: assets.length ? null : 'top_risk_inputs_unavailable',
    },
    scan_score_status: {
      id: 'scan_score_status',
      title: 'Score / Status',
      type: 'scan_score_status',
      severity: scoreToSeverity(
        typeof aiData?.investment_score?.overall === 'number'
          ? aiData.investment_score.overall
          : null,
      ),
      confidence: typeof aiData?.investment_score?.overall === 'number' ? 'high' : 'low',
      shortSummary:
        typeof aiData?.investment_score?.overall === 'number'
          ? `Score ${aiData.investment_score.overall} com status consolidado de carteira.`
          : 'Score indisponível com dados atuais.',
      detailedExplanation: [
        'O score sintetiza qualidade estrutural da carteira em múltiplos fatores.',
        'A decisão ideal é atacar primeiro o fator de menor desempenho.',
      ],
      deterministicFacts: input.insights.cards.find((card) => card.type === 'investment_score_explanation')?.deterministicFacts || [],
      aiSynthesis: null,
      actionIfTaken: 'Executar a próxima ação de maior impacto no score.',
      consequenceIfIgnored: 'A evolução da carteira tende a ficar abaixo do potencial.',
      relatedAssets: [],
      relatedClasses: [],
      suggestedActions: [
        {label: 'Ver composição da carteira', route: '/portfolio'},
      ],
      visualData: {
        type: 'bar_comparison',
        rows: [
          {label: 'Diversificação', value: Number(aiData?.investment_score?.diversification || 0)},
          {label: 'Risco', value: Number(aiData?.investment_score?.risk || 0)},
          {label: 'Consistência', value: Number(aiData?.investment_score?.consistency || 0)},
          {label: 'Volatilidade', value: Number(aiData?.investment_score?.volatility || 0)},
        ],
      },
      degradedState: typeof aiData?.investment_score?.overall !== 'number',
      unavailableReason:
        typeof aiData?.investment_score?.overall === 'number'
          ? null
          : 'score_breakdown_unavailable',
    },
    scan_market_signal: {
      id: 'scan_market_signal',
      title: 'Sinal de Mercado',
      type: 'scan_market_signal',
      severity:
        typeof internationalPct === 'number' && internationalPct < 10
          ? 'high'
          : 'medium',
      confidence: typeof internationalPct === 'number' ? 'high' : 'low',
      shortSummary:
        typeof internationalPct === 'number'
          ? `Exposição internacional estimada em ${internationalPct.toFixed(2)}%.`
          : 'Exposição internacional indisponível.',
      detailedExplanation: [
        'Esse sinal mede quanto a carteira depende de um único regime de mercado local.',
        'Maior exposição internacional tende a reduzir risco de concentração geográfica.',
      ],
      deterministicFacts: [
        typeof internationalPct === 'number'
          ? `Exposição internacional: ${internationalPct.toFixed(2)}%.`
          : 'Sem dados para exposição internacional.',
      ],
      aiSynthesis: null,
      actionIfTaken: 'Avaliar inclusão gradual de ativos globais para balancear regimes.',
      consequenceIfIgnored: 'A carteira segue mais sensível ao mesmo ciclo local.',
      relatedAssets: assets.filter((asset) => isLikelyInternational(asset)).map((asset) => asset.symbol),
      relatedClasses: [],
      suggestedActions: [
        {label: 'Abrir planejamento', route: '/planning'},
      ],
      visualData: {
        type: 'bar_comparison',
        rows: [
          {label: 'Exposição internacional', value: internationalPct},
          {label: 'Exposição doméstica', value: typeof internationalPct === 'number' ? 100 - internationalPct : null},
        ],
      },
      degradedState: typeof internationalPct !== 'number',
      unavailableReason:
        typeof internationalPct === 'number'
          ? null
          : 'market_signal_unavailable',
    },
  };
}
