import type {
  AiAnalysisResult,
  OpportunityRadarResponse,
  PortfolioErrorRadarAlert,
  PortfolioErrorRadarAlertType,
  PortfolioErrorRadarResponse,
} from '@/services/ai';
import type {BadgeSeverity} from './insights.styles';

export const ALL_TAB = 'Tudo';

export interface FeedInsight {
  id: string;
  category: string;
  /** `null` quando a fonte não informa prioridade — nunca inventada. */
  priority: 'Alta' | 'Média' | 'Baixa' | null;
  severity: BadgeSeverity;
  title: string;
  body: string;
  /** Detalhe técnico, exibido a partir do nível intermediário. */
  depth?: string;
  /** A API ainda não devolve confiança nem nº de fontes por insight. */
  confidence: string | null;
  sources: string | null;
  generatedAt: number | null;
  model: string;
  aiGenerated: boolean;
  action: {label: string; to: string};
}

export interface InsightTab {
  label: string;
  count: number;
}

const RADAR_TYPE_LABEL: Record<PortfolioErrorRadarAlertType, string> = {
  concentration: 'Concentração',
  diversification: 'Diversificação',
  volatility: 'Volatilidade',
  other: 'Risco',
};

const SEVERITY_ORDER: Record<PortfolioErrorRadarAlert['severity'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const PRIORITY_BY_SEVERITY = {
  high: {priority: 'Alta', severity: 'neg'},
  medium: {priority: 'Média', severity: 'warn'},
  low: {priority: 'Baixa', severity: 'info'},
} as const;

function assetAction(symbol?: string): FeedInsight['action'] {
  return symbol
    ? {label: 'Ver ativo', to: `/asset/${encodeURIComponent(symbol)}`}
    : {label: 'Ver carteira', to: '/portfolio'};
}

export function buildFeedInsights(params: {
  radar: PortfolioErrorRadarResponse | null;
  analysis: AiAnalysisResult | null;
  radarUpdatedAt: number | null;
  opportunityRadar?: OpportunityRadarResponse | null;
}): FeedInsight[] {
  const {radar, analysis, radarUpdatedAt, opportunityRadar} = params;
  const aiData = analysis?.ai_analysis ?? analysis;

  const alerts = [...(radar?.alerts ?? [])].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  const radarInsights = alerts.map<FeedInsight>((alert, index) => ({
    id: `radar-${alert.code}-${alert.symbol ?? index}`,
    category: RADAR_TYPE_LABEL[alert.type],
    ...PRIORITY_BY_SEVERITY[alert.severity],
    title: alert.message,
    body: alert.symbol
      ? `Alerta calculado sobre a posição em ${alert.symbol}.`
      : 'Alerta calculado sobre a carteira como um todo.',
    depth: `Regra ${alert.code} · radar determinístico, sem LLM.`,
    confidence: null,
    sources: null,
    generatedAt: radarUpdatedAt,
    model: radar?.modelVersion ?? 'portfolio_error_radar_v1',
    aiGenerated: false,
    action: assetAction(alert.symbol),
  }));

  // TRA-14: endpoint dedicado (TRA-8) no lugar de `aiData?.opportunity_radar`,
  // que vinha embutido na resposta legada do trackerr-ia e nunca foi
  // religado a este feed.
  const opportunityInsights = (opportunityRadar?.opportunities ?? []).map<FeedInsight>(
    (item, index) => ({
      id: `opp-${item.symbol}-${index}`,
      category: 'Oportunidade',
      priority: null,
      severity: 'info',
      title: item.symbol,
      body: item.rationale.signals.join(' · ') || `${item.symbol} em condição interessante.`,
      confidence: null,
      sources: null,
      generatedAt: opportunityRadar ? radarUpdatedAt : null,
      model: opportunityRadar?.modelVersion ?? 'opportunity_radar_v1',
      aiGenerated: false,
      action: assetAction(item.symbol),
    }),
  );

  const strategyInsights = (aiData?.rebalancing?.top_moves ?? []).map<FeedInsight>(
    (move, index) => ({
      id: `move-${index}`,
      category: 'Estratégia',
      priority: null,
      severity: 'info',
      title: move,
      body: 'Movimentação sugerida pelo modelo de rebalanceamento.',
      confidence: null,
      sources: null,
      generatedAt: null,
      model: 'Trackerr IA',
      aiGenerated: true,
      action: {label: 'Ver carteira', to: '/portfolio'},
    }),
  );

  return [...radarInsights, ...opportunityInsights, ...strategyInsights];
}

/** Mesma regra do protótipo: "Tudo" + categorias presentes, na ordem em que aparecem. */
export function buildInsightTabs(insights: FeedInsight[]): InsightTab[] {
  const categories = insights
    .map((insight) => insight.category)
    .filter((category, index, all) => all.indexOf(category) === index);
  return [
    {label: ALL_TAB, count: insights.length},
    ...categories.map((label) => ({
      label,
      count: insights.filter((insight) => insight.category === label).length,
    })),
  ];
}

export function formatRelativeTime(timestamp: number | null, now: number): string {
  if (timestamp === null) return '—';
  const minutes = Math.floor((now - timestamp) / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return new Date(timestamp).toLocaleDateString('pt-BR');
}
