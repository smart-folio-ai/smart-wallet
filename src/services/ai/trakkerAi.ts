import {AiAnalysisResult, aiAnalysisService} from '@/services/ai';
import {fiscalService} from '@/server/api/api';

const AI_CACHE_TTL_MS = 30 * 60 * 1000;
const AI_CACHE_PREFIX = 'trakker_ai_analysis_v2';

type AiPlan = 'free' | 'premium' | 'pro';

type NormalizedAsset = {
  symbol: string;
  type: string;
  quantity: number;
  price: number;
  current_price: number;
  change_24h: number;
  sector?: string;
  metrics?: Record<string, unknown>;
};

export type HighlightItem = {
  title: string;
  content: string;
  impact: 'positive' | 'negative' | 'neutral';
};

export type AssetRecommendation = 'buy' | 'hold' | 'sell';

function normalizeAssets(rawAssets: any[]): NormalizedAsset[] {
  return (rawAssets || [])
    .map((asset: any) => ({
      symbol: String(asset.symbol || asset.ticker || '').toUpperCase(),
      type: String(asset.type || 'stock').toLowerCase(),
      quantity: Number(asset.quantity || asset.amount || 0),
      price: Number(asset.average_price || asset.averagePrice || asset.price || 0),
      current_price: Number(asset.current_price || asset.price || 0),
      change_24h: Number(asset.change_24h || asset.change24h || 0),
      sector: asset.sector ? String(asset.sector) : undefined,
      metrics: buildAssetMetrics(asset),
    }))
    .filter((asset) => Boolean(asset.symbol));
}

function normalizePercentInput(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  // Some providers return fractions (0.12), others already percent (12).
  return parsed <= 1 ? parsed * 100 : parsed;
}

function buildAssetMetrics(asset: any): Record<string, unknown> | undefined {
  if (!asset || typeof asset !== 'object') return undefined;
  const symbol = String(asset.symbol || asset.ticker || '').toUpperCase();
  const type = String(asset.type || 'stock').toLowerCase();
  const indicators = (asset.indicators || {}) as Record<string, unknown>;

  if (type === 'stock' || type === 'etf') {
    return {
      symbol,
      roe_5y: normalizePercentInput(indicators.roe),
      cagr_5y: normalizePercentInput(
        indicators.cagr5y ?? indicators.cagr_5y ?? indicators.revenueCagr5y,
      ),
      dividend_yield: normalizePercentInput(
        indicators.dividendYield ?? indicators.currentYield,
      ),
      governance_score: Number(indicators.governanceScore || 0),
      net_debt_ebitda: Number(indicators.debtEbitda || indicators.netDebtEbitda || 0),
      is_blue_chip: Boolean(indicators.isBlueChip),
      is_state_free:
        indicators.isStateControlled === undefined
          ? true
          : !Boolean(indicators.isStateControlled),
    };
  }

  if (type === 'fii') {
    return {
      symbol,
      pvp_ratio: Number(indicators.pvpRatio || indicators.priceToBook || 1),
      current_yield: normalizePercentInput(
        indicators.currentYield ?? indicators.dividendYield,
      ),
      sector_yield_avg: normalizePercentInput(indicators.sectorYieldAvg),
      dividend_years: Number(indicators.dividendYears || 0),
      main_tenant_concentration: Number(indicators.mainTenantConcentration || 0),
      main_property_concentration: Number(indicators.mainPropertyConcentration || 0),
    };
  }

  return undefined;
}

export function getAiPlanFromPlanName(planName: string): AiPlan {
  const normalized = String(planName || '').toLowerCase();
  if (normalized.includes('premium')) return 'premium';
  if (normalized.includes('pro')) return 'pro';
  return 'free';
}

export function isProOrHigherPlan(planName: string, isSubscribed: boolean): boolean {
  if (!isSubscribed) return false;
  const normalized = String(planName || '').toLowerCase();
  return normalized.includes('pro') || normalized.includes('premium');
}

export function buildAiCacheSignature(rawAssets: any[]): string {
  const assets = normalizeAssets(rawAssets)
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .map((asset) =>
      [
        asset.symbol,
        asset.type,
        asset.quantity.toFixed(6),
        asset.price.toFixed(6),
        asset.current_price.toFixed(6),
      ].join(':'),
    )
    .join('|');

  return assets || 'empty';
}

function getCacheKey(userId: string, plan: AiPlan, signature: string): string {
  return `${AI_CACHE_PREFIX}:${userId}:${plan}:${signature}`;
}

function readCachedAnalysis(cacheKey: string): AiAnalysisResult | null {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !parsed?.data) return null;
    const expired = Date.now() - Number(parsed.savedAt) > AI_CACHE_TTL_MS;
    if (expired) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return parsed.data as AiAnalysisResult;
  } catch {
    return null;
  }
}

function writeCachedAnalysis(cacheKey: string, data: AiAnalysisResult) {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      }),
    );
  } catch {
    // ignore cache write failures
  }
}

export async function getOrCreateAiAnalysis(params: {
  rawAssets: any[];
  plan: AiPlan;
  userId?: string;
  forceRefresh?: boolean;
}): Promise<AiAnalysisResult> {
  const {rawAssets, plan, forceRefresh = false} = params;
  const userId = params.userId || 'default_user';
  const normalizedAssets = normalizeAssets(rawAssets);
  const signature = buildAiCacheSignature(rawAssets);
  const cacheKey = getCacheKey(userId, plan, signature);

  if (!forceRefresh) {
    const cached = readCachedAnalysis(cacheKey);
    if (cached) return cached;
  }

  const totalValue = normalizedAssets.reduce(
    (sum, asset) => sum + asset.current_price * asset.quantity,
    0,
  );

  const payload = {
    user_id: userId,
    profile_plan: plan,
    portfolio: {
      id: 'default',
      name: 'Principal',
      cpf: '',
      assets: normalizedAssets,
      total_value: totalValue,
      plan,
    },
    risk_profile: 'moderate' as const,
    address: {},
    preferences: {},
  };

  const result = await aiAnalysisService.analyze(payload as any);
  writeCachedAnalysis(cacheKey, result);
  return result;
}

export function deriveDashboardHighlights(params: {
  rawAssets: any[];
  summary: any;
  analysis: AiAnalysisResult | null;
}): HighlightItem[] {
  const {rawAssets, summary, analysis} = params;
  const highlights: HighlightItem[] = [];

  const aiData = analysis?.ai_analysis || analysis;
  const smartFeed = aiData?.smart_feed || [];

  for (const item of smartFeed.slice(0, 3)) {
    highlights.push({
      title: item.title,
      content: item.content,
      impact: item.impact || 'neutral',
    });
  }

  const assets = normalizeAssets(rawAssets);
  const totalValue = assets.reduce(
    (sum, asset) => sum + asset.current_price * asset.quantity,
    0,
  );

  if (totalValue > 0) {
    const bySector: Record<string, number> = {};
    for (const asset of assets) {
      const key = asset.sector || 'Outros';
      bySector[key] =
        (bySector[key] || 0) + asset.current_price * asset.quantity;
    }
    const [topSector = 'Outros', topValue = 0] = Object.entries(bySector).sort(
      (a, b) => b[1] - a[1],
    )[0] || [];

    const concentration = (topValue / totalValue) * 100;
    if (concentration >= 35) {
      highlights.push({
        title: `Você tem ${concentration.toFixed(0)}% da carteira em ${topSector}.`,
        content: `Isso aumenta seu risco de concentração setorial.`,
        impact: 'negative',
      });
    }

    const internationalValue = assets
      .filter((asset) => {
        const symbol = asset.symbol;
        return (
          symbol.includes('USD') ||
          symbol.includes('USDT') ||
          symbol.endsWith('34') ||
          symbol.endsWith('39') ||
          asset.type === 'crypto'
        );
      })
      .reduce((sum, asset) => sum + asset.current_price * asset.quantity, 0);
    const internationalPct = (internationalValue / totalValue) * 100;
    if (internationalPct < 10) {
      highlights.push({
        title: 'Seu portfólio não possui exposição internacional suficiente.',
        content: `Hoje sua exposição estimada está em ${internationalPct.toFixed(1)}%.`,
        impact: 'negative',
      });
    }
  }

  if (typeof summary?.change24h === 'number') {
    const positive = summary.change24h >= 0;
    highlights.push({
      title: positive
        ? `Hoje sua carteira ganhou ${formatMoney(summary.change24h)}.`
        : `Hoje sua carteira caiu ${formatMoney(Math.abs(summary.change24h))}.`,
      content: 'Variação consolidada no período de 24 horas.',
      impact: positive ? 'positive' : 'negative',
    });
  }

  if (typeof summary?.totalDividends === 'number' && summary.totalDividends > 0) {
    const monthlyProjection = summary.totalDividends / 12;
    highlights.push({
      title: `Dividendos previstos este mês: ${formatMoney(monthlyProjection)}.`,
      content: 'Estimativa proporcional baseada nos dividendos acumulados.',
      impact: 'positive',
    });
  }

  return highlights.slice(0, 6);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeRecommendation(value: unknown): AssetRecommendation | undefined {
  if (!value) return undefined;
  const normalized = String(value).toLowerCase().trim();
  if (
    normalized.includes('buy') ||
    normalized.includes('compra') ||
    normalized.includes('comprar')
  ) {
    return 'buy';
  }
  if (
    normalized.includes('sell') ||
    normalized.includes('venda') ||
    normalized.includes('vender')
  ) {
    return 'sell';
  }
  if (
    normalized.includes('hold') ||
    normalized.includes('manter') ||
    normalized.includes('neutral')
  ) {
    return 'hold';
  }
  return undefined;
}

export function extractAssetRecommendationsFromAnalysis(
  analysis: AiAnalysisResult | null | undefined,
): Record<string, AssetRecommendation> {
  if (!analysis) return {};
  const map: Record<string, AssetRecommendation> = {};
  const anyAnalysis = analysis as any;

  const sources = [
    anyAnalysis?.stock_scores,
    anyAnalysis?.ai_analysis?.stock_scores,
    anyAnalysis?.recommendationsByAsset,
    anyAnalysis?.ai_analysis?.recommendationsByAsset,
    anyAnalysis?.recommendations,
    anyAnalysis?.ai_analysis?.recommendations,
  ].filter(Boolean);

  for (const source of sources) {
    if (Array.isArray(source)) {
      for (const item of source) {
        const data: any = item;
        const symbol = String(data?.symbol || data?.ticker || '').toUpperCase();
        const recommendation = normalizeRecommendation(
          data?.recommendation ?? data?.action ?? data?.signal ?? data,
        );
        if (symbol && recommendation) {
          map[symbol] = recommendation;
        }
      }
      continue;
    }

    for (const [symbol, payload] of Object.entries(source)) {
      const data: any = payload;
      const recommendation = normalizeRecommendation(
        data?.recommendation ?? data?.action ?? data,
      );
      if (recommendation) {
        map[String(symbol).toUpperCase()] = recommendation;
      }
    }
  }

  const opportunitySources = [
    anyAnalysis?.opportunity_radar,
    anyAnalysis?.ai_analysis?.opportunity_radar,
  ].filter(Array.isArray);
  for (const source of opportunitySources) {
    for (const item of source as any[]) {
      const symbol = String(item?.symbol || '').toUpperCase();
      if (symbol && !map[symbol]) {
        map[symbol] = 'buy';
      }
    }
  }

  return map;
}

export async function answerPortfolioQuestion(params: {
  question: string;
  rawAssets: any[];
  summary: any;
  planName: string;
}): Promise<string> {
  const {question, rawAssets, summary} = params;
  const text = question.toLowerCase();

  try {
    const response = await aiAnalysisService.chat({
      question,
      context: {
        portfolioSummary: summary,
        assets: rawAssets,
      },
      profile_plan: getAiPlanFromPlanName(params.planName),
    });
    if (response?.answer) return response.answer;
  } catch {
    // fallback local below
  }

  if (text.includes('vender') && text.includes('metade')) {
    const symbolMatch = question.toUpperCase().match(/[A-Z]{4}\d{1,2}|BTC|ETH|SOL|XRP/);
    const symbol = symbolMatch?.[0];
    const asset = (rawAssets || []).find(
      (a: any) => String(a.symbol || '').toUpperCase() === symbol,
    );
    if (asset && symbol) {
      const quantity = Math.max(1, Math.floor(Number(asset.quantity || 0) / 2));
      const sellPrice = Number(asset.current_price || asset.price || 0);
      if (quantity > 0 && sellPrice > 0) {
        try {
          const preview = (
            await fiscalService.previewSale({
              symbol,
              quantity,
              sellPrice,
            })
          ).data;
          return `Se você vender metade de ${symbol} agora (${quantity} cotas a ${formatMoney(
            sellPrice,
          )}), o lucro estimado é ${formatMoney(
            preview.profit || 0,
          )} e o imposto estimado é ${formatMoney(preview.estimatedTax || 0)}.`;
        } catch {
          return 'Não consegui simular o imposto dessa venda agora. Tente novamente em instantes.';
        }
      }
    }
  }

  if (text.includes('arriscad')) {
    const assets = normalizeAssets(rawAssets);
    const totalValue = assets.reduce(
      (sum, asset) => sum + asset.current_price * asset.quantity,
      0,
    );
    if (totalValue > 0) {
      const top = [...assets]
        .sort(
          (a, b) =>
            b.current_price * b.quantity - a.current_price * a.quantity,
        )
        .at(0);
      if (top) {
        const topPct =
          ((top.current_price * top.quantity) / totalValue) * 100;
        return `Hoje sua maior posição é ${top.symbol} com ${topPct.toFixed(
          1,
        )}% da carteira. Acima de 25% já indica concentração relevante de risco.`;
      }
    }
  }

  if (text.includes('dividend')) {
    const totalDividends = Number(summary?.totalDividends || 0);
    if (totalDividends > 0) {
      return `Com base no histórico atual, sua estimativa anualizada de dividendos é ${formatMoney(
        totalDividends,
      )}, com média mensal aproximada de ${formatMoney(totalDividends / 12)}.`;
    }
  }

  return 'Consegui ler seus dados, mas preciso de uma pergunta um pouco mais específica para responder com precisão. Exemplo: "Se eu vender 50% de PETR4 hoje, quanto pago de imposto?"';
}
