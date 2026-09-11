import {useEffect, useMemo, useState} from 'react';
import portfolioService from '@/services/portfolio';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {fiscalService, stockServices} from '@/server/api/api';
import {FeatureTourModal} from '@/components/ui/feature-tour-modal';
import {
  Area,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {formatCurrency} from '@/utils';
import {CustomTooltip} from '@/components/ui/custom-tooltip';
import {useSubscription} from '@/hooks/useSubscription';
import {useAdaptiveLevel} from '@/contexts/AdaptiveLevelContext';
import {usePortfolioReturns} from '@/hooks/usePortfolioReturns';
import {usePortfolioComposition} from '@/hooks/usePortfolioComposition';
import {describeLargestGap} from '@/pages/composition-display.utils';
import {QuantMetricCell} from '@/components/shared/QuantMetricCell';
import {
  buildResult12mKpi,
  buildVarKpi,
  formatBetaNote,
  formatDrawdownNote,
  formatSharpeNote,
} from '@/pages/risk-display.utils';
import {
  formatCurrencyCompactPtBr,
  formatPctPtBr,
  formatSignedPctPtBr,
} from '@/utils/formatters';
import {
  buildAiCacheSignature,
  deriveDashboardHighlights,
  extractAssetRecommendationsFromAnalysis,
  getAiPlanFromPlanName,
  getOrCreateAiAnalysis,
  isProOrHigherPlan,
} from '@/services/ai/trakkerAi';
import {
  getAveragePrice,
  computePnl,
  computeReturnSinceAvgPrice,
  deriveMarketDataStatus,
} from '@/pages/dashboard-summary.utils';
import {accumulateCdi} from '@/pages/cdi-performance.utils';
import {
  parseHistoryDate,
  filterHistoryByPeriod,
  brapiRangeForDays,
  getEffectiveHistoryWindow,
  HISTORY_WINDOW_DAYS,
} from '@/pages/benchmark-window.utils';
import {
  KpiCard,
  SectionHeader,
  AiInsightBanner,
  PeriodSelector,
  DataTable,
  MarketDataStaleBanner,
} from '@/components/shared';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  // Retorno desde o preço médio de compra — não é variação diária.
  returnSinceAvgPrice: number;
  amount: number;
  value: number;
  allocation: number;
  type: 'stock' | 'crypto' | 'fii' | 'etf' | 'fund' | 'other';
  dividendYield?: number;
  dividendHistory?: {date: string; value: number}[];
}

interface PortfolioSummary {
  totalValue: number;
  totalPnl: number | null;
  totalPnlPercentage: number | null;
  totalDividends: number;
  distribution: {
    stocks: number;
    crypto: number;
    fiis: number;
    other: number;
  };
  history: {
    date: string;
    value: number;
  }[];
  lastDividends: {
    date: string;
    symbol: string;
    value: number;
    type: 'stock' | 'fii' | 'other';
  }[];
  dividendEntries: {
    date: string;
    symbol: string;
    value: number;
    type: 'stock' | 'fii' | 'other';
  }[];
}

interface FiscalOptimizerOpportunity {
  symbol: string;
  estimatedTaxWithOffset: number;
  taxSaved: number;
  headline: string;
}

interface FiscalOptimizerResponse {
  year: number;
  accumulatedLosses: {
    total: number;
  };
  opportunities: FiscalOptimizerOpportunity[];
  explanation: string;
}

interface MarketComparator {
  key: 'portfolio' | 'dollar' | 'ibov' | 'cdi';
  label: string;
  value: number | null;
  variationPct: number | null;
  colorClass: string;
}

interface ActionableInsight {
  priority: 'Alta' | 'Média' | 'Baixa';
  title: string;
  description: string;
}

const ALLOCATION_COLORS = {
  stocks: 'hsl(var(--chart-2))',
  crypto: 'hsl(var(--chart-1))',
  fiis: 'hsl(var(--chart-4))',
  other: 'hsl(var(--chart-3))',
};

const PERIODS = [
  {label: '1M', value: '1M'},
  {label: '3M', value: '3M'},
  {label: '6M', value: '6M'},
  {label: '1A', value: '1A'},
  {label: '2A', value: '2A'},
];

const formatHistoryDate = (value: unknown): string => {
  const parsed = parseHistoryDate(value);
  return parsed
    ? parsed.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '-';
};

const computeDailyReturns = (
  history: {date: string; value: number}[],
): number[] => {
  const returns: number[] = [];
  for (let i = 1; i < history.length; i += 1) {
    const previous = Number(history[i - 1]?.value || 0);
    const current = Number(history[i]?.value || 0);
    if (previous <= 0 || current <= 0) continue;
    returns.push((current - previous) / previous);
  }
  return returns;
};

const computeDailyVolatility = (
  history: {date: string; value: number}[],
): number | null => {
  if (history.length < 3) return null;

  const returns = computeDailyReturns(history);
  if (returns.length < 2) return null;

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (returns.length - 1);
  return Math.sqrt(variance) * 100;
};

// Sharpe reaproveita a mesma série de retornos diários usada pela
// Volatilidade acima (histórico reconstruído das negociações, ver
// `history-from-trades.ts` no server) e a taxa CDI diária oficial (BACEN
// SGS 12) como proxy de taxa livre de risco. Mesmo guard de tamanho mínimo
// da Volatilidade — não inventa Sharpe sobre 1-2 pontos.
const computeSharpeRatio = (
  history: {date: string; value: number}[],
  cdiDailyPct: number | null,
): number | null => {
  if (history.length < 3) return null;
  if (cdiDailyPct === null || !Number.isFinite(cdiDailyPct)) return null;

  const returns = computeDailyReturns(history);
  if (returns.length < 2) return null;

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  if (!Number.isFinite(stdDev) || stdDev === 0) return null;

  const riskFreeDaily = cdiDailyPct / 100;
  const excessDaily = mean - riskFreeDaily;
  // Anualiza por 252 dias úteis (convenção padrão), assumindo retornos iid
  // — mesma premissa simplificada já usada pela Volatilidade exibida.
  const sharpe = (excessDaily / stdDev) * Math.sqrt(252);
  return Number.isFinite(sharpe) ? sharpe : null;
};

// Máximo drawdown: maior queda percentual entre um pico e um vale
// subsequente na série de valor da carteira. Ao contrário de Beta/Tracking
// Error (que exigem retornos diários pareados dia-a-dia com o IBOV), o
// drawdown só depende da ordem dos valores da própria carteira — os trechos
// "achatados" entre negociações (ver `history-from-trades.ts`) no máximo
// subestimam a queda real, nunca fabricam uma queda que não existiu.
const computeMaxDrawdownPct = (
  history: {date: string; value: number}[],
): number | null => {
  if (history.length < 3) return null;

  let peak = -Infinity;
  let maxDrawdown = 0;
  let sawValidPoint = false;

  for (const point of history) {
    const value = Number(point?.value || 0);
    if (value <= 0) continue;
    sawValidPoint = true;
    if (value > peak) peak = value;
    if (peak > 0) {
      const drawdown = (value - peak) / peak;
      if (drawdown < maxDrawdown) maxDrawdown = drawdown;
    }
  }

  if (!sawValidPoint) return null;
  return maxDrawdown * 100;
};

const parseGlobalComparator = (
  payload: any,
): {value: number | null; variationPct: number | null} => {
  const first = payload?.results?.[0];
  if (!first) return {value: null, variationPct: null};

  const value = Number(
    first.close ?? first.last ?? first.price ?? first.regularMarketPrice,
  );
  const variationPct = Number(
    first.percent_change ?? first.regularMarketChangePercent,
  );

  return {
    value: Number.isFinite(value) ? value : null,
    variationPct: Number.isFinite(variationPct) ? variationPct : null,
  };
};

const formatMonthYear = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR', {month: '2-digit', year: '2-digit'});
};

const toIsoDate = (value: unknown): string | null => {
  const parsed = parseHistoryDate(value);
  if (!parsed) return null;
  return parsed.toISOString().slice(0, 10);
};

const classLabel = (type: string): string => {
  if (type === 'stock') return 'Ação';
  if (type === 'fii') return 'FII';
  if (type === 'crypto') return 'Cripto';
  if (type === 'etf') return 'ETF';
  if (type === 'fund') return 'Fundo';
  return 'Outro';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const {level} = useAdaptiveLevel();
  // Retornos (TWR, beta, tracking error) e composição (yield on cost, desvio da
  // política) alimentam os slots do handoff: delta do Patrimônio, 3º KPI,
  // barra quant e linha de desvio do card Alocação (TRA-141).
  const {data: returnsData} = usePortfolioReturns();
  const {data: composition} = usePortfolioComposition();
  const {
    planName,
    isSubscribed,
    isLoading: loadingSubscription,
  } = useSubscription();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [openFeatureTour, setOpenFeatureTour] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const featureTourStorageKey = 'dashboard_feature_tour_seen_v1';

  const {data: portfolios = []} = useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      return await portfolioService.getPortfolios();
    },
  });

  useEffect(() => {
    if (!selectedPortfolioId && portfolios.length > 0) {
      setSelectedPortfolioId(portfolios[0].id || portfolios[0]._id);
    }
  }, [portfolios, selectedPortfolioId]);

  const {
    data: portfolioPayload,
    isLoading: loading,
    dataUpdatedAt: portfolioUpdatedAt,
  } = useQuery({
    queryKey: ['dashboardPortfolio', selectedPortfolioId],
    enabled: Boolean(selectedPortfolioId),
    queryFn: async () => {
      if (!selectedPortfolioId || selectedPortfolioId === 'all') {
        return await portfolioService.getAssets();
      }
      return await portfolioService.getPortfolio(selectedPortfolioId);
    },
  });

  const {data: portfolioHistory = []} = useQuery({
    queryKey: ['dashboardHistory', selectedPortfolioId],
    enabled: Boolean(selectedPortfolioId) && selectedPortfolioId !== 'all',
    queryFn: async () => {
      return await portfolioService.getPortfolioHistory(selectedPortfolioId);
    },
  });

  const {data: optimizerData, isLoading: loadingOptimizer} =
    useQuery<FiscalOptimizerResponse>({
      queryKey: ['fiscal-optimizer-dashboard'],
      queryFn: async () => (await fiscalService.getOptimizer()).data,
    });

  const {data: marketComparators} = useQuery({
    queryKey: ['dashboard-market-comparators'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const [dollarResponse, ibovResponse, btcResponse, cdiResponse] =
        await Promise.allSettled([
          stockServices.getNationalStock('USDBRL=X'),
          stockServices.getNationalStock('^BVSP'),
          stockServices.getNationalStock('BTC-USD'),
          stockServices.getCdiRate(),
        ]);

      return {
        dollar:
          dollarResponse.status === 'fulfilled'
            ? parseGlobalComparator(dollarResponse.value.data)
            : {value: null, variationPct: null},
        ibov:
          ibovResponse.status === 'fulfilled'
            ? parseGlobalComparator(ibovResponse.value.data)
            : {value: null, variationPct: null},
        btc:
          btcResponse.status === 'fulfilled'
            ? parseGlobalComparator(btcResponse.value.data)
            : {value: null, variationPct: null},
        cdi:
          cdiResponse.status === 'fulfilled'
            ? (() => {
                const cdiValue = Number(cdiResponse.value.data?.value);
                return {
                  value: Number.isFinite(cdiValue) ? cdiValue : null,
                  unit: cdiResponse.value.data?.unit ?? 'daily_percent',
                  variationPct: null,
                };
              })()
            : {value: null, unit: 'daily_percent', variationPct: null},
      };
    },
  });

  useEffect(() => {
    const hasSeen = localStorage.getItem(featureTourStorageKey) === '1';
    if (!hasSeen) {
      setOpenFeatureTour(true);
    }
  }, []);

  const apiAssets = useMemo(() => {
    if (!portfolioPayload) return [];
    if (Array.isArray(portfolioPayload)) return portfolioPayload;
    return portfolioPayload.assets ?? [];
  }, [portfolioPayload]);

  const marketStatus = useMemo(
    () => deriveMarketDataStatus(apiAssets),
    [apiAssets],
  );

  const summary = useMemo<PortfolioSummary>(() => {
    const totalValue = apiAssets.reduce(
      (sum: number, asset: any) => sum + (asset.total || 0),
      0,
    );

    const totalCost = apiAssets.reduce(
      (sum: number, asset: any) =>
        sum + getAveragePrice(asset) * Number(asset.quantity || 0),
      0,
    );

    // Se qualquer posição em carteira está sem cotação viva, agregamos P&L
    // que mistura preço fresco com preço parado — o número parece real e não
    // é. Retornar null aqui faz o KpiCard mostrar "—" (o banner do topo
    // conta o porquê ao usuário). TRA-92.
    const {pnl: profitLoss, pnlPercentage: profitLossPercentage} =
      marketStatus.isStale
        ? {pnl: null, pnlPercentage: null}
        : computePnl(totalValue, totalCost);

    const calculateAllocation = (type: string) => {
      if (totalValue === 0) return 0;
      const typeTotal = apiAssets
        .filter((a: any) => {
          if (type === 'other')
            return !['stock', 'crypto', 'fii'].includes(a.type);
          return a.type === type;
        })
        .reduce((sum: number, a: any) => sum + (a.total || 0), 0);
      return Number(((typeTotal / totalValue) * 100).toFixed(2));
    };

    const dividendEntries = apiAssets.flatMap((asset: any) => {
      const history = asset.dividendHistory ?? [];
      return history.map((entry: any) => ({
        symbol: asset.symbol,
        type:
          asset.type === 'fii'
            ? 'fii'
            : asset.type === 'stock'
              ? 'stock'
              : 'other',
        date: entry.date,
        value: (entry.value ?? 0) * (asset.quantity ?? 0),
      }));
    });

    const totalDividends = dividendEntries.reduce(
      (sum: number, entry: any) => sum + (entry.value || 0),
      0,
    );

    const historyData =
      selectedPortfolioId !== 'all' && portfolioHistory.length > 0
        ? portfolioHistory.map((item: any) => ({
            date: item.date,
            value: item.totalValue ?? 0,
          }))
        : [];

    return {
      totalValue,
      totalPnl: profitLoss,
      totalPnlPercentage: profitLossPercentage,
      totalDividends,
      distribution: {
        stocks: calculateAllocation('stock'),
        crypto: calculateAllocation('crypto'),
        fiis: calculateAllocation('fii'),
        other: calculateAllocation('other'),
      },
      history: historyData,
      lastDividends: dividendEntries
        .sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .slice(0, 10),
      dividendEntries: dividendEntries.sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    };
  }, [apiAssets, portfolioHistory, selectedPortfolioId, marketStatus.isStale]);

  const assets = useMemo<Asset[]>(() => {
    const totalValue = summary.totalValue;
    return apiAssets.map((a: any) => {
      const val = a.total || 0;
      const returnSinceAvgPrice = computeReturnSinceAvgPrice(a, val);

      return {
        id: a.id || a._id,
        symbol: a.symbol,
        name: a.name || a.longName || a.symbol,
        price: a.price,
        returnSinceAvgPrice,
        amount: a.quantity,
        value: val,
        allocation:
          totalValue > 0 ? Number(((val / totalValue) * 100).toFixed(2)) : 0,
        type: a.type,
        dividendYield: a.indicators?.dividendYield ?? 0,
        dividendHistory: a.dividendHistory ?? [],
      };
    });
  }, [apiAssets, summary.totalValue]);

  const distributionData = useMemo(
    () => [
      {
        name: 'Ações',
        value: summary.distribution.stocks,
        amount: (summary.totalValue * summary.distribution.stocks) / 100,
        color: ALLOCATION_COLORS.stocks,
      },
      {
        name: 'Cripto',
        value: summary.distribution.crypto,
        amount: (summary.totalValue * summary.distribution.crypto) / 100,
        color: ALLOCATION_COLORS.crypto,
      },
      {
        name: 'FIIs',
        value: summary.distribution.fiis,
        amount: (summary.totalValue * summary.distribution.fiis) / 100,
        color: ALLOCATION_COLORS.fiis,
      },
      {
        name: 'Outros',
        value: summary.distribution.other,
        amount: (summary.totalValue * summary.distribution.other) / 100,
        color: ALLOCATION_COLORS.other,
      },
    ],
    [summary.distribution, summary.totalValue],
  );

  const allocationChartData = [...distributionData]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const dividendMonthlyData = useMemo(() => {
    const monthlyMap = new Map<string, number>();
    const now = new Date();
    const months: string[] = [];

    for (let i = 11; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0',
      )}`;
      months.push(key);
      monthlyMap.set(key, 0);
    }

    for (const dividend of summary.dividendEntries || []) {
      const date = new Date(dividend.date);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap.has(key)) continue;
      monthlyMap.set(
        key,
        (monthlyMap.get(key) || 0) + Number(dividend.value || 0),
      );
    }

    return months.map((key) => ({
      month: key,
      label: formatMonthYear(`${key}-01`),
      value: monthlyMap.get(key) || 0,
    }));
  }, [summary.dividendEntries]);

  const totalDividendsYear = useMemo(
    () =>
      dividendMonthlyData.reduce(
        (sum, month) => sum + Number(month.value || 0),
        0,
      ),
    [dividendMonthlyData],
  );
  const dividendMonthlyAverage = totalDividendsYear / 12;

  const nextDividend = useMemo(() => {
    const today = new Date();
    return (summary.dividendEntries || [])
      .filter((item) => {
        const date = new Date(item.date);
        return !Number.isNaN(date.getTime()) && date >= today;
      })
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];
  }, [summary.dividendEntries]);

  const estimatedDividendYieldPct =
    // Sem cotação viva o preço do ativo (e portanto o valor total da carteira)
    // não é confiável — dividir o dividendo por um denominador parado dava
    // um DY inflado ou zerado sem qualquer aviso (TRA-92).
    marketStatus.isStale
      ? null
      : summary.totalValue > 0
        ? (totalDividendsYear / summary.totalValue) * 100
        : null;

  const topPositions = useMemo(
    () => [...assets].sort((a, b) => b.value - a.value).slice(0, 5),
    [assets],
  );
  const topGainers = useMemo(
    () =>
      [...assets]
        .filter((item) => item.returnSinceAvgPrice > 0)
        .sort((a, b) => b.returnSinceAvgPrice - a.returnSinceAvgPrice)
        .slice(0, 3),
    [assets],
  );
  const topLosers = useMemo(
    () =>
      [...assets]
        .filter((item) => item.returnSinceAvgPrice < 0)
        .sort((a, b) => a.returnSinceAvgPrice - b.returnSinceAvgPrice)
        .slice(0, 3),
    [assets],
  );

  const topOpportunities = useMemo(
    () =>
      (optimizerData?.opportunities || [])
        .slice()
        .sort((a, b) => b.taxSaved - a.taxSaved)
        .slice(0, 3)
        .map((item) => ({
          key: item.symbol,
          title: `${item.symbol}: potencial economia fiscal ${formatCurrency(item.taxSaved)}`,
          subtitle: item.headline,
        })),
    [optimizerData?.opportunities],
  );

  const hasProOrHigher = isProOrHigherPlan(planName, isSubscribed);
  const aiPlan = getAiPlanFromPlanName(planName);
  const aiSignature = useMemo(
    () => buildAiCacheSignature(apiAssets),
    [apiAssets],
  );

  const {data: dashboardAiAnalysis} = useQuery({
    queryKey: ['dashboard-ai-analysis', aiPlan, aiSignature],
    enabled: hasProOrHigher && apiAssets.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () =>
      getOrCreateAiAnalysis({
        rawAssets: apiAssets,
        plan: aiPlan,
      }),
  });

  const aiRecommendationMap = useMemo(
    () => extractAssetRecommendationsFromAnalysis(dashboardAiAnalysis),
    [dashboardAiAnalysis],
  );
  const dashboardHighlights = useMemo(
    () =>
      deriveDashboardHighlights({
        rawAssets: apiAssets,
        summary,
        analysis: dashboardAiAnalysis || null,
      }).slice(0, 3),
    [apiAssets, dashboardAiAnalysis, summary],
  );
  const aiDashboardHighlights = useMemo(
    () => dashboardHighlights.filter((item) => item.source === 'ai'),
    [dashboardHighlights],
  );
  const derivedDashboardHighlights = useMemo(
    () => dashboardHighlights.filter((item) => item.source === 'derived'),
    [dashboardHighlights],
  );

  const aiOpportunities = useMemo(
    () =>
      assets
        .filter((asset) => aiRecommendationMap[asset.symbol] === 'buy')
        .slice(0, 3)
        .map((asset) => ({
          key: asset.symbol,
          title: `${asset.symbol} em zona de oportunidade`,
          subtitle: `Recomendação da IA: compra • alocação atual ${asset.allocation.toFixed(2)}%`,
        })),
    [aiRecommendationMap, assets],
  );

  const visibleOpportunities =
    topOpportunities.length > 0 ? topOpportunities : aiOpportunities;

  const concentrationInfo = useMemo(() => {
    if (!distributionData.length) return null;
    const top = distributionData.slice().sort((a, b) => b.value - a.value)[0];
    return top || null;
  }, [distributionData]);

  // Meta de alocação-alvo (TRA-68): antes lida direto do localStorage
  // (`portfolio_target_allocation`), que nunca era escrito por nenhuma
  // tela e por isso não sobrevivia à troca de dispositivo/navegador.
  const {data: targetAllocation = null} = useQuery({
    queryKey: ['portfolio-target-allocation'],
    queryFn: async () => {
      return await portfolioService.getTargetAllocation();
    },
  });

  const allocationContext = useMemo(() => {
    const rows = [
      {label: 'Ações', key: 'stocks', current: summary.distribution.stocks},
      {label: 'Cripto', key: 'crypto', current: summary.distribution.crypto},
      {label: 'FIIs', key: 'fiis', current: summary.distribution.fiis},
      {label: 'Outros', key: 'other', current: summary.distribution.other},
    ] as const;

    return rows.map((row) => {
      const target =
        targetAllocation && typeof targetAllocation[row.key] === 'number'
          ? Number(targetAllocation[row.key])
          : null;
      const delta = target !== null ? row.current - target : null;
      return {label: row.label, current: row.current, target, delta};
    });
  }, [summary.distribution, targetAllocation]);

  const actionableInsights = useMemo<ActionableInsight[]>(() => {
    const insights: ActionableInsight[] = [];

    if (
      summary.totalPnlPercentage !== null &&
      summary.totalPnlPercentage < -0.5
    ) {
      const biggestDrop = topLosers[0];
      insights.push({
        priority: 'Alta',
        title: 'Carteira abaixo do custo médio',
        description: biggestDrop
          ? `A carteira está abaixo do custo médio em ${Math.abs(summary.totalPnlPercentage).toFixed(2)}%, com destaque para ${biggestDrop.symbol} (${biggestDrop.returnSinceAvgPrice.toFixed(2)}% desde o preço médio).`
          : `A carteira está abaixo do custo médio em ${Math.abs(summary.totalPnlPercentage).toFixed(2)}%.`,
      });
    }

    if (concentrationInfo && concentrationInfo.value >= 30) {
      insights.push({
        priority: 'Alta',
        title: 'Concentração acima do recomendado',
        description: `${concentrationInfo.name} representa ${concentrationInfo.value.toFixed(2)}% do patrimônio.`,
      });
    }

    if ((optimizerData?.opportunities || []).length > 0) {
      const best = optimizerData?.opportunities
        ?.slice()
        .sort((a, b) => b.taxSaved - a.taxSaved)[0];
      if (best) {
        insights.push({
          priority: 'Média',
          title: 'Oportunidade fiscal identificada',
          description: `${best.symbol}: potencial de economia tributária em ${formatCurrency(best.taxSaved)}.`,
        });
      }
    } else {
      insights.push({
        priority: 'Baixa',
        title: 'Sem ação fiscal imediata',
        description:
          'No cenário atual, não há oportunidade fiscal clara com os dados disponíveis.',
      });
    }

    if ((summary.totalDividends || 0) > 0) {
      insights.push({
        priority: 'Média',
        title: 'Fluxo de dividendos ativo',
        description: `Você acumula ${formatCurrency(summary.totalDividends)} em proventos no período analisado.`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        priority: 'Baixa',
        title: 'Dados insuficientes para recomendações',
        description:
          'Sincronize carteira e histórico para gerar ações mais específicas.',
      });
    }

    return insights.slice(0, 4);
  }, [concentrationInfo, optimizerData?.opportunities, summary, topLosers]);

  const recommendedActions = useMemo(() => {
    const actions: {title: string; reason: string}[] = [];

    if (concentrationInfo && concentrationInfo.value >= 30) {
      actions.push({
        title: 'Revisar concentração da carteira',
        reason: `${concentrationInfo.name} com ${concentrationInfo.value.toFixed(2)}% de participação.`,
      });
    }

    if ((optimizerData?.opportunities || []).length > 0) {
      const first = optimizerData?.opportunities?.[0];
      if (first) {
        actions.push({
          title: `Rodar simulação fiscal de ${first.symbol}`,
          reason: `Economia potencial estimada: ${formatCurrency(first.taxSaved)}.`,
        });
      }
    }

    if (topLosers.length > 0) {
      actions.push({
        title: `Reavaliar posição em ${topLosers[0].symbol}`,
        reason: `Queda de ${Math.abs(topLosers[0].returnSinceAvgPrice).toFixed(2)}% desde o preço médio.`,
      });
    }

    if (topGainers.length > 0) {
      actions.push({
        title: `Atualizar plano para ${topGainers[0].symbol}`,
        reason: `Alta de ${topGainers[0].returnSinceAvgPrice.toFixed(2)}% desde o preço médio.`,
      });
    }

    return actions.slice(0, 4);
  }, [concentrationInfo, optimizerData?.opportunities, topGainers, topLosers]);

  const marketComparatorCards: MarketComparator[] = useMemo(
    () => [
      {
        key: 'portfolio',
        label: 'Carteira',
        value: summary.totalValue || null,
        variationPct: summary.totalPnlPercentage ?? null,
        colorClass: 'text-primary',
      },
      {
        key: 'dollar',
        label: 'Dólar (USD/BRL)',
        value: marketComparators?.dollar?.value ?? null,
        variationPct: marketComparators?.dollar?.variationPct ?? null,
        colorClass: 'text-[hsl(var(--chart-1))]',
      },
      {
        key: 'ibov',
        label: 'IBOV',
        value: marketComparators?.ibov?.value ?? null,
        variationPct: marketComparators?.ibov?.variationPct ?? null,
        colorClass: 'text-[hsl(var(--chart-3))]',
      },
      {
        key: 'cdi',
        label: 'CDI',
        value: marketComparators?.cdi?.value ?? null,
        variationPct: marketComparators?.cdi?.variationPct ?? null,
        colorClass: 'text-[hsl(var(--chart-2))]',
      },
    ],
    [marketComparators, summary.totalPnlPercentage, summary.totalValue],
  );

  const historyByPeriod = useMemo(
    () => filterHistoryByPeriod(summary.history || [], selectedPeriod),
    [selectedPeriod, summary.history],
  );

  // Janela real coberta por `historyByPeriod` (já com o fallback de "período
  // sem pontos suficientes usa o histórico inteiro" aplicado) — não o
  // período nominal. As três séries de benchmark seguem essa janela para
  // nunca cobrir um span menor que o que o gráfico de fato plota.
  const effectiveHistoryWindow = useMemo(
    () => getEffectiveHistoryWindow(historyByPeriod),
    [historyByPeriod],
  );

  // Quando `filterHistoryByPeriod` cai no fallback (o recorte pedido tinha
  // 1 ponto ou menos e ele devolveu o histórico inteiro), a janela efetiva
  // cobre mais dias do que o período nominal escolhido. Sem isto, clicar em
  // 7D/1M/3M/etc. com pouco histórico troca o botão ativo mas o gráfico
  // continua idêntico — silencioso, parece bug em vez de "sem dado".
  const periodFallbackActive = Boolean(
    effectiveHistoryWindow &&
      effectiveHistoryWindow.days > (HISTORY_WINDOW_DAYS[selectedPeriod] || 30),
  );

  const {data: benchmarkHistory} = useQuery({
    queryKey: [
      'dashboard-benchmark-history',
      effectiveHistoryWindow?.fromIso,
      effectiveHistoryWindow?.toIso,
    ],
    enabled: Boolean(effectiveHistoryWindow),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const window = effectiveHistoryWindow!;
      const range = brapiRangeForDays(window.days);

      const [ibovHistoryResponse, btcHistoryResponse, cdiHistoryResponse] =
        await Promise.allSettled([
          stockServices.getNationalStock('^BVSP', {range, interval: '1d'}),
          stockServices.getNationalStock('BTC-USD', {range, interval: '1d'}),
          stockServices.getCdiSeries(window.fromIso, window.toIso),
        ]);

      const parseHistory = (payload: any) => {
        const series = payload?.results?.[0]?.historicalDataPrice;
        if (!Array.isArray(series)) return [];
        return series
          .map((point: any) => ({
            date:
              typeof point?.date === 'number'
                ? new Date(point.date * 1000).toISOString().slice(0, 10)
                : null,
            value: Number(point?.close),
          }))
          .filter((point: any) => point.date && Number.isFinite(point.value))
          .sort((a: any, b: any) =>
            String(a.date).localeCompare(String(b.date)),
          );
      };

      const cdiSeries =
        cdiHistoryResponse.status === 'fulfilled'
          ? cdiHistoryResponse.value.data?.series
          : null;

      return {
        ibov:
          ibovHistoryResponse.status === 'fulfilled'
            ? parseHistory(ibovHistoryResponse.value.data)
            : [],
        btc:
          btcHistoryResponse.status === 'fulfilled'
            ? parseHistory(btcHistoryResponse.value.data)
            : [],
        cdi: Array.isArray(cdiSeries) ? cdiSeries : [],
      };
    },
  });

  const comparisonChartData = useMemo(() => {
    if (!historyByPeriod || historyByPeriod.length < 2) return [];

    const sortedPortfolio = [...historyByPeriod].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const portfolioBase = Number(sortedPortfolio[0]?.value || 0);
    if (!Number.isFinite(portfolioBase) || portfolioBase <= 0) return [];

    const ibovMap = new Map<string, number>(
      (benchmarkHistory?.ibov || []).map((point: any) => [
        String(point.date),
        Number(point.value),
      ]),
    );
    const btcMap = new Map<string, number>(
      (benchmarkHistory?.btc || []).map((point: any) => [
        String(point.date),
        Number(point.value),
      ]),
    );
    const cdiMap = accumulateCdi(benchmarkHistory?.cdi || []);

    const firstIbovComparablePoint = sortedPortfolio.find((point) => {
      const isoDate = toIsoDate(point.date);
      if (!isoDate) return false;
      const ibovValue = ibovMap.get(isoDate);
      return Number.isFinite(Number(ibovValue)) && Number(ibovValue) > 0;
    });
    const firstBtcComparablePoint = sortedPortfolio.find((point) => {
      const isoDate = toIsoDate(point.date);
      if (!isoDate) return false;
      const btcValue = btcMap.get(isoDate);
      return Number.isFinite(Number(btcValue)) && Number(btcValue) > 0;
    });

    const firstIbovDate = firstIbovComparablePoint
      ? toIsoDate(firstIbovComparablePoint.date)
      : null;
    const firstBtcDate = firstBtcComparablePoint
      ? toIsoDate(firstBtcComparablePoint.date)
      : null;
    const firstIbovValue = firstIbovDate ? ibovMap.get(firstIbovDate) : null;
    const firstBtcValue = firstBtcDate ? btcMap.get(firstBtcDate) : null;

    const firstCdiComparablePoint = sortedPortfolio.find((point) => {
      const isoDate = toIsoDate(point.date);
      if (!isoDate) return false;
      const cdiValue = cdiMap.get(isoDate);
      return Number.isFinite(Number(cdiValue));
    });
    const firstCdiDate = firstCdiComparablePoint
      ? toIsoDate(firstCdiComparablePoint.date)
      : null;
    const firstCdiValue = firstCdiDate ? cdiMap.get(firstCdiDate) : null;

    return sortedPortfolio.map((point) => {
      const isoDate = toIsoDate(point.date);
      const portfolioPerformance =
        (Number(point.value) / portfolioBase - 1) * 100;
      const ibovValue = isoDate ? ibovMap.get(isoDate) : undefined;
      const btcValue = isoDate ? btcMap.get(isoDate) : undefined;
      const cdiValue = isoDate ? cdiMap.get(isoDate) : undefined;

      return {
        date: point.date,
        portfolioPerformance: Number.isFinite(portfolioPerformance)
          ? portfolioPerformance
          : null,
        ibovPerformance:
          firstIbovValue && ibovValue && ibovValue > 0
            ? (ibovValue / firstIbovValue - 1) * 100
            : null,
        btcPerformance:
          firstBtcValue && btcValue && btcValue > 0
            ? (btcValue / firstBtcValue - 1) * 100
            : null,
        cdiPerformance:
          Number.isFinite(Number(firstCdiValue)) &&
          Number.isFinite(Number(cdiValue))
            ? ((1 + Number(cdiValue) / 100) /
                (1 + Number(firstCdiValue) / 100) -
                1) *
              100
            : null,
      };
    });
  }, [
    benchmarkHistory?.btc,
    benchmarkHistory?.cdi,
    benchmarkHistory?.ibov,
    historyByPeriod,
  ]);

  const comparisonAvailability = useMemo(
    () => ({
      hasIbov: comparisonChartData.some(
        (point) => point.ibovPerformance !== null,
      ),
      hasBtc: comparisonChartData.some(
        (point) => point.btcPerformance !== null,
      ),
      hasCdi: comparisonChartData.some(
        (point) => point.cdiPerformance !== null,
      ),
    }),
    [comparisonChartData],
  );

  // Enquanto as fontes de cotação não estão ligadas, o preço de cada ativo
  // fica congelado no valor da importação. O snapshot diário grava
  // quantidade × preço, então grava o mesmo número todo dia e a curva sai
  // reta — por falta de dado, não por defeito. Sem dizer isso, linha reta
  // e P&L parado leem como produto quebrado (TRA-92).
  const portfolioSeriesIsFlat = useMemo(() => {
    if (comparisonChartData.length < 2) return false;
    const values = comparisonChartData
      .map((point) => Number(point.portfolioPerformance))
      .filter((value) => Number.isFinite(value));
    if (values.length < 2) return false;
    return Math.max(...values) - Math.min(...values) < 0.005;
  }, [comparisonChartData]);

  const benchmarkCards = useMemo(
    () => [
      {
        label: 'Carteira (período)',
        value:
          historyByPeriod.length > 1
            ? ((historyByPeriod[historyByPeriod.length - 1].value -
                historyByPeriod[0].value) /
                historyByPeriod[0].value) *
              100
            : null,
      },
      {label: 'IBOV', value: marketComparators?.ibov?.variationPct ?? null},
      {label: 'BTC', value: marketComparators?.btc?.variationPct ?? null},
    ],
    [
      historyByPeriod,
      marketComparators?.btc?.variationPct,
      marketComparators?.ibov?.variationPct,
    ],
  );

  const volatilityPct = useMemo(
    () => computeDailyVolatility(summary.history || []),
    [summary.history],
  );

  const maxDrawdownPct = useMemo(
    () => computeMaxDrawdownPct(summary.history || []),
    [summary.history],
  );

  const sharpeRatio = useMemo(
    () =>
      computeSharpeRatio(summary.history || [], marketComparators?.cdi?.value ?? null),
    [summary.history, marketComparators?.cdi?.value],
  );
  const futureDividendEvents = useMemo(() => {
    const now = new Date();
    return (summary.dividendEntries || [])
      .filter((event) => {
        const date = new Date(event.date);
        return !Number.isNaN(date.getTime()) && date >= now;
      })
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .slice(0, 4);
  }, [summary.dividendEntries]);

  const pnlLabel =
    level === 'iniciante'
      ? 'Como está indo'
      : level === 'avancado'
        ? 'P&L (custo médio)'
        : 'P&L do período';

  const pnlSub =
    summary.totalPnl === null || summary.totalPnlPercentage === null
      ? 'custo médio indisponível'
      : level === 'iniciante'
        ? 'desde o preço médio'
        : `${summary.totalPnlPercentage >= 0 ? '+' : '-'}${Math.abs(summary.totalPnlPercentage).toFixed(2)}%`;

  // ── Nocturne layout variables ─────────────────────────────────────────────

  const levelHint =
    level === 'iniciante'
      ? 'Modo Iniciante: exibindo métricas essenciais para acompanhar sua carteira.'
      : level === 'avancado'
        ? 'Modo Avançado: exibindo métricas quantitativas e análise detalhada da carteira.'
        : 'Modo Intermediário: exibindo métricas de performance e alocação por classe.';

  const levelMeta =
    level === 'iniciante'
      ? 'Nível: Iniciante'
      : level === 'avancado'
        ? 'Nível: Avançado'
        : 'Nível: Intermediário';

  const totalValueDelta =
    summary.totalPnl !== null
      ? `${summary.totalPnl >= 0 ? '+' : ''}${formatCurrency(Math.abs(summary.totalPnl))}`
      : undefined;

  const totalValueDeltaStyle: React.CSSProperties = {
    fontVariantNumeric: 'tabular-nums',
    color:
      summary.totalPnl === null
        ? 'var(--color-neutral-500)'
        : summary.totalPnl >= 0
          ? 'var(--pos)'
          : 'var(--neg)',
  };

  const pnlDelta =
    summary.totalPnlPercentage !== null
      ? `${summary.totalPnlPercentage >= 0 ? '+' : ''}${summary.totalPnlPercentage.toFixed(2)}%`
      : undefined;

  const pnlDeltaStyle: React.CSSProperties = {
    fontVariantNumeric: 'tabular-nums',
    color:
      summary.totalPnl === null
        ? 'var(--color-neutral-500)'
        : summary.totalPnl >= 0
          ? 'var(--pos)'
          : 'var(--neg)',
  };

  const divYieldDelta =
    estimatedDividendYieldPct !== null
      ? `${estimatedDividendYieldPct.toFixed(2)}% DY`
      : undefined;

  // ── Slots do handoff alimentados por /returns e /composition (TRA-141) ──
  const isAdvancedLevel = level === 'avancado';
  const twrValue = returnsData?.twr?.value ?? null;
  const marketGainPct = returnsData?.contribution?.marketGainPct ?? null;
  const benchmarkMetrics = returnsData?.benchmark ?? null;
  const portfolioYieldOnCost = composition?.yield?.portfolioYieldOnCost ?? null;
  const largestGapLine = describeLargestGap(
    composition?.rebalancing?.largestGap,
  );

  // Delta do Patrimônio conforme o handoff (`kpisAdv` / `kpisBase` do
  // protótipo App): no avançado é o TWR, "TWR desde início"; nos demais, o
  // rendimento sobre o que foi aportado, "desde o aporte inicial" — que é a
  // decomposição aporte vs rendimento no slot que o handoff reserva a ela. Sem
  // o dado, mantém o P&L em reais que o card já mostrava, nunca um traço.
  const patrimonioReturn = isAdvancedLevel ? twrValue : marketGainPct;
  const patrimonioDelta =
    patrimonioReturn !== null
      ? formatSignedPctPtBr(patrimonioReturn * 100)
      : totalValueDelta;
  const patrimonioDeltaStyle: React.CSSProperties =
    patrimonioReturn !== null
      ? {
          fontVariantNumeric: 'tabular-nums',
          color: patrimonioReturn >= 0 ? 'var(--pos)' : 'var(--neg)',
        }
      : totalValueDeltaStyle;
  const patrimonioSub =
    patrimonioReturn === null
      ? 'total investido'
      : isAdvancedLevel
        ? 'TWR desde início'
        : 'desde o aporte inicial';

  // 3º KPI do avançado no handoff é "Yield on cost". Só assume o slot com
  // valor real; sem histórico de proventos, o card de dividendos continua.
  const showYieldOnCost = isAdvancedLevel && portfolioYieldOnCost !== null;
  const yieldOnCostSub = composition
    ? `proventos ${formatCurrencyCompactPtBr(composition.yield.estimatedAnnualIncome)}${
        // Quantidade atual projetada nos 12 meses superestima posição nova;
        // o servidor sinaliza e a tela diz em vez de esconder.
        composition.yield.approximated ? ' · estimado' : ''
      }`
    : undefined;

  // Barra quantitativa, na ordem do handoff: Sharpe, Volatilidade, Beta vs
  // IBOV, Máx. drawdown, Tracking error.
  //
  // Beta e tracking error saíram em TRA-145 porque eram '—' fixo — sem série
  // marcada a mercado não havia como calculá-los. TRA-143 corrigiu a série e
  // TRA-141 escreveu o cálculo; voltam aqui, onde o protótipo App os põe, no
  // nível avançado e SÓ com valor calculado. Nunca traço.
  //
  // Tooltips com o texto do GLOSSARY do protótipo, verbatim.
  const ptBr2 = (value: number) =>
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  // `computeDailyVolatility` devolve o desvio DIÁRIO. O handoff define
  // volatilidade anualizada (× √252) — a mesma premissa iid que o Sharpe já
  // usa. Anualizar na exibição faz número, nota e tooltip concordarem.
  const annualVolatilityPct =
    volatilityPct !== null ? volatilityPct * Math.sqrt(252) : null;
  const showBenchmarkMetrics = isAdvancedLevel && benchmarkMetrics !== null;

  // Sharpe e drawdown do servidor usam retorno ajustado por fluxo — um resgate
  // não vira queda. O cálculo local sobre o valor bruto fica só como reserva
  // enquanto o servidor não tem série suficiente (TRA-141).
  const serverRisk = returnsData?.risk;
  const serverSharpe = serverRisk?.sharpe?.sharpe ?? null;
  const displaySharpe = serverSharpe ?? sharpeRatio;
  const sharpeNote =
    (serverSharpe !== null && formatSharpeNote(serverRisk?.sharpe?.riskFreeAnnual)) ||
    (displaySharpe !== null ? 'anualizado' : 'dados insuficientes');
  const serverDrawdown = serverRisk?.drawdown;
  const displayDrawdownPct =
    serverDrawdown?.maxDrawdown != null
      ? serverDrawdown.maxDrawdown * 100
      : maxDrawdownPct;
  const drawdownNote =
    (serverDrawdown?.maxDrawdown != null && formatDrawdownNote(serverDrawdown)) ||
    'pior retração';

  // 2º e 4º KPIs do `kpisAdv` do handoff: Resultado 12M com alpha e VaR 95% ·
  // 21d. Só assumem o slot com número calculado.
  const result12mKpi = isAdvancedLevel
    ? buildResult12mKpi(benchmarkMetrics ?? undefined)
    : null;
  const varKpi = isAdvancedLevel ? buildVarKpi(serverRisk) : null;

  const quantMetrics = [
    {
      label: 'Sharpe',
      value: displaySharpe !== null ? ptBr2(displaySharpe) : '—',
      note: sharpeNote,
      tooltip: {
        title: 'Sharpe',
        body: 'Quanto de retorno a carteira entregou por unidade de risco assumido. Acima de 1,0 é considerado bom: você foi bem pago pelo sobe-e-desce que aceitou.',
        formula:
          '(retorno da carteira − taxa livre de risco) ÷ volatilidade · janela 252 dias úteis',
      },
    },
    {
      label: 'Volatilidade',
      value:
        annualVolatilityPct !== null ? formatPctPtBr(annualVolatilityPct, 1) : '—',
      note: 'anualizada 252d',
      tooltip: {
        title: 'Volatilidade',
        body: 'O tamanho médio das oscilações da carteira. Variações desse tamanho para cima ou para baixo são normais — não são erro nem prejuízo definitivo.',
        formula:
          'desvio-padrão dos retornos diários × √252 · janela 252 dias úteis',
      },
    },
    ...(showBenchmarkMetrics && benchmarkMetrics.beta !== null
      ? [
          {
            label: 'Beta vs IBOV',
            value: ptBr2(benchmarkMetrics.beta),
            note:
              formatBetaNote(benchmarkMetrics.upBeta, benchmarkMetrics.downBeta) ??
              `${benchmarkMetrics.observations} pregões`,
            tooltip: {
              title: 'Beta vs IBOV',
              body: 'Quanto a carteira se move quando o IBOV se move. Abaixo de 1, para cada 1% de alta do índice a carteira sobe menos — e cai menos também nas quedas.',
              formula:
                'covariância(carteira, IBOV) ÷ variância(IBOV) · janela 252 dias úteis',
            },
          },
        ]
      : []),
    {
      label: 'Máx. drawdown',
      value:
        displayDrawdownPct !== null ? formatPctPtBr(displayDrawdownPct, 1) : '—',
      note: drawdownNote,
      tooltip: {
        title: 'Máximo drawdown',
        body: 'A maior queda já vivida entre um topo e o fundo seguinte, antes de recuperar. É o pior momento histórico da carteira — útil para saber o que você aguentaria de novo.',
        formula: '(menor valor após o topo ÷ topo) − 1 · pior janela do histórico',
        side: 'right' as const,
      },
    },
    ...(showBenchmarkMetrics && benchmarkMetrics.trackingError !== null
      ? [
          {
            label: 'Tracking error',
            value: formatPctPtBr(benchmarkMetrics.trackingError * 100, 1),
            note: 'vs IBOV',
            tooltip: {
              title: 'Tracking error',
              body: 'Quanto a sua carteira se descola do benchmark que você definiu. Quanto maior, mais o resultado depende das suas escolhas, e menos do índice.',
              formula:
                'desvio-padrão da diferença de retorno (carteira − benchmark) anualizado',
              side: 'right' as const,
            },
          },
        ]
      : []),
  ];

  const portfolioPeriodPct =
    historyByPeriod.length > 1
      ? ((historyByPeriod[historyByPeriod.length - 1].value -
          historyByPeriod[0].value) /
          historyByPeriod[0].value) *
        100
      : null;

  const chartLegend = [
    {
      label: 'Carteira',
      color: 'var(--ac)',
      value:
        portfolioPeriodPct !== null
          ? `${portfolioPeriodPct >= 0 ? '+' : ''}${portfolioPeriodPct.toFixed(1)}%`
          : '—',
      positive: portfolioPeriodPct !== null ? portfolioPeriodPct >= 0 : true,
    },
    {
      label: 'IBOV',
      color: 'var(--cy)',
      value:
        marketComparators?.ibov?.variationPct != null
          ? `${marketComparators.ibov.variationPct >= 0 ? '+' : ''}${marketComparators.ibov.variationPct.toFixed(1)}%`
          : '—',
      positive: (marketComparators?.ibov?.variationPct ?? 0) >= 0,
    },
    {
      label: 'CDI',
      color: 'var(--color-neutral-500)',
      value:
        marketComparators?.cdi?.value != null
          ? `${(marketComparators.cdi.value * 252 * 100).toFixed(1)}% a.a.`
          : '—',
      positive: true,
    },
  ];

  const allocation = allocationChartData.map((a) => ({
    label: a.name,
    color: a.color,
    pct: `${a.value.toFixed(1)}%`,
    value: formatCurrency(a.amount),
  }));

  const allocSub = `${allocationChartData.filter((a) => a.value > 0).length} classes`;

  const insights = actionableInsights.slice(0, 3).map((ins, idx) => ({
    id: idx,
    icon:
      ins.priority === 'Alta'
        ? 'ph ph-warning-circle'
        : ins.priority === 'Média'
          ? 'ph ph-lightbulb'
          : 'ph ph-info',
    tag:
      ins.priority === 'Alta'
        ? 'Alerta'
        : ins.priority === 'Média'
          ? 'Insight'
          : 'Info',
    title: ins.title,
    body: ins.description,
  }));

  const upcomingDividends = futureDividendEvents.map((d) => ({
    symbol: d.symbol,
    type: d.type === 'fii' ? 'FII' : d.type === 'stock' ? 'Ação' : 'Outro',
    comDate: formatHistoryDate(d.date),
    value: formatCurrency(d.value),
    perShare: '—',
  }));

  // ── End Nocturne layout variables ─────────────────────────────────────────

  if (loading || loadingSubscription || loadingOptimizer) {
    return <div style={{padding: 24, color: 'var(--color-neutral-500)'}}>Carregando...</div>;
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      {/* Feature tour (logic preserved, modal invisible until triggered) */}
      <FeatureTourModal
        open={openFeatureTour}
        onOpenChange={setOpenFeatureTour}
        heading="Conheça as novidades"
        subheading="Recursos que melhoram suas decisões"
        items={[
          {
            title: 'Investment Score',
            description:
              'Uma nota de 0-100 baseada em diversificação, risco e consistência, visível na página de Insights.',
          },
          {
            title: 'Simulador de Futuro',
            description:
              'Agora você pode simular aportes mensais e ver projeções em cenários otimistas, neutros e pessimistas.',
          },
          {
            title: 'Radar Anti-Erro',
            description:
              'A IA detecta erros de concentração de setor e correlação, emitindo alertas preventivos.',
          },
          {
            title: 'Radar de Oportunidades',
            description:
              'Uma lista premium de ativos com potencial de valorização baseada na análise da IA.',
          },
          {
            title: 'Opinião Trackerr IA',
            description:
              'Integrada na página de detalhes de cada ativo para entregar um resumo estratégico rápido.',
          },
        ]}
        onExit={() => {
          localStorage.setItem(featureTourStorageKey, '1');
          setOpenFeatureTour(false);
          navigate('/portfolio');
        }}
        onSkip={() => {
          localStorage.setItem(featureTourStorageKey, '1');
          setOpenFeatureTour(false);
        }}
        onStartTutorial={() => {
          localStorage.setItem(featureTourStorageKey, '1');
          setOpenFeatureTour(false);
          navigate('/ai-insights');
        }}
      />

      {marketStatus.isStale && (
        <MarketDataStaleBanner
          updatedAt={portfolioUpdatedAt || null}
          staleCount={marketStatus.staleCount}
          totalCount={marketStatus.totalCount}
          staleSymbols={marketStatus.staleSymbols}
        />
      )}

      {/* 1. Adaptive level banner */}
      <AiInsightBanner
        text={levelHint}
        meta={levelMeta}
        actionLabel="Como a IA decidiu"
        onAction={() => {}}
      />

      {/* 2. 4 KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${varKpi ? 4 : 3}, minmax(0,1fr))`,
          gap: 11.2,
        }}>
        <KpiCard
          label="Patrimônio total"
          value={formatCurrency(summary.totalValue)}
          delta={patrimonioDelta}
          deltaStyle={patrimonioDeltaStyle}
          sub={patrimonioSub}
        />
        {result12mKpi ? (
          <KpiCard
            label="Resultado 12M"
            value={result12mKpi.value}
            delta={result12mKpi.delta}
            deltaStyle={{
              fontVariantNumeric: 'tabular-nums',
              color: result12mKpi.positive ? 'var(--pos)' : 'var(--neg)',
            }}
            sub={result12mKpi.sub}
            tooltip={{
              title: 'Alpha',
              body: 'O retorno que veio das suas escolhas, além do que o índice já teria dado. Medido em pontos percentuais (p.p.) sobre o benchmark.',
              formula: 'retorno da carteira − (beta × retorno do benchmark)',
            }}
          />
        ) : (
          <KpiCard
            label={pnlLabel}
            value={
              summary.totalPnl === null
                ? '—'
                : `${summary.totalPnl >= 0 ? '+' : ''}${formatCurrency(Math.abs(summary.totalPnl))}`
            }
            delta={pnlDelta}
            deltaStyle={pnlDeltaStyle}
            sub={pnlSub}
            tooltip={{
              title: 'P&L',
              body: 'Ganho/perda realizado + não realizado',
              formula: '(Cotação - PM) × Qtd',
            }}
          />
        )}
        {/*
          3º KPI: no avançado o handoff põe "Yield on cost" (`kpisAdv`); nos
          demais níveis, proventos. O protótipo mostra um delta "+0,6 p.p." no
          YoC, mas ele exige o YoC do período anterior, que ainda não é
          guardado — omitido em vez de inventado.
        */}
        {showYieldOnCost ? (
          <KpiCard
            label="Yield on cost"
            value={formatPctPtBr((portfolioYieldOnCost as number) * 100)}
            sub={yieldOnCostSub}
            tooltip={{
              title: 'Yield on cost',
              body: 'Os proventos dos últimos 12 meses divididos pelo que você pagou pelos ativos — não pelo preço de hoje. Mostra o retorno em renda sobre o seu custo real.',
              formula: 'proventos 12M ÷ preço médio de aquisição da posição',
              side: 'right',
            }}
          />
        ) : (
          <KpiCard
            label="Dividendos recebidos"
            value={formatCurrency(totalDividendsYear)}
            delta={divYieldDelta}
            deltaStyle={{color: 'var(--pos)', fontVariantNumeric: 'tabular-nums'}}
            sub="últimos 12 meses"
          />
        )}
        {/*
          4º KPI do `kpisAdv` do handoff: VaR 95% · 21d. O antigo "Beta da
          carteira" com '—' fixo saiu em TRA-145; o slot volta só no avançado e
          só com VaR calculado pelo servidor — nunca vazio (TRA-141).
        */}
        {varKpi && (
          <KpiCard
            label="VaR 95% · 21d"
            value={varKpi.value}
            delta={varKpi.delta}
            deltaStyle={{fontVariantNumeric: 'tabular-nums', color: 'var(--neg)'}}
            sub={varKpi.sub}
            tooltip={{
              title: 'VaR 95% · 21 dias',
              body: 'A perda que não deve ser ultrapassada em 95% dos meses. Em 19 de cada 20 meses a perda tende a ficar abaixo desse valor — nos 5% restantes pode ser maior.',
              formula: 'percentil 5% da distribuição de retornos em 21 dias × patrimônio',
              side: 'right',
            }}
          />
        )}
      </div>

      {/* 3. Quant bar (intermediário/avançado only) */}
      {level !== 'iniciante' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${quantMetrics.length}, minmax(0,1fr))`,
            gap: 1,
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'var(--hair-soft)',
            // `visible`, não `hidden`: a tooltip de cada métrica é absoluta e
            // sai da célula — `hidden` a cortaria. Os cantos arredondados que o
            // `hidden` garantia passam a vir das próprias células das pontas
            // (prop `edge` do QuantMetricCell).
            overflow: 'visible',
          }}>
          {/*
            Célula com tooltip de métrica no padrão do handoff: ícone info,
            nome, definição em linguagem comum e fórmula com janela.
          */}
          {quantMetrics.map((q, index) => (
            <QuantMetricCell
              key={q.label}
              {...q}
              edge={
                quantMetrics.length === 1
                  ? 'only'
                  : index === 0
                    ? 'first'
                    : index === quantMetrics.length - 1
                      ? 'last'
                      : undefined
              }
            />
          ))}
        </div>
      )}

      {/* 4. Evolução + Alocação */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.9fr) minmax(0,1fr)',
          gap: 16.8,
        }}>
        <section
          style={{
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'var(--nk-card)',
            display: 'flex',
            flexDirection: 'column',
          }}>
          <SectionHeader
            title="Evolução patrimonial"
            subtitle="Retorno % · carteira vs IBOV vs CDI"
            action={
              <PeriodSelector
                periods={PERIODS}
                value={selectedPeriod}
                onChange={setSelectedPeriod}
              />
            }
          />
          <div style={{padding: 16.8}}>
            {/* Chart legend */}
            <div
              style={{display: 'flex', gap: 16.8, marginBottom: 11.2, flexWrap: 'wrap'}}>
              {chartLegend.map((l) => (
                <div
                  key={l.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5.6,
                    fontSize: 11,
                    color: 'var(--color-neutral-400)',
                  }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: l.color,
                      flexShrink: 0,
                    }}
                  />
                  <span>{l.label}</span>
                  <span
                    style={{
                      color: l.positive ? 'var(--pos)' : 'var(--neg)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                    {l.value}
                  </span>
                </div>
              ))}
            </div>
            <div
              role="img"
              aria-label="Gráfico de desempenho percentual da carteira comparado a IBOV e CDI">
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart
                  data={comparisonChartData}
                  margin={{top: 10, right: 8, left: 0, bottom: 0}}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--hair)"
                  />
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    labelFormatter={(label) => formatHistoryDate(label)}
                    content={
                      <CustomTooltip
                        formatter={(value, name) => [
                          `${Number(value).toFixed(2)}%`,
                          name,
                        ]}
                        labelFormatter={(label) => formatHistoryDate(label)}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="portfolioPerformance"
                    name="Carteira"
                    stroke="var(--ac)"
                    strokeWidth={2.5}
                    fillOpacity={0.12}
                    fill="var(--ac)"
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="ibovPerformance"
                    name="IBOV"
                    stroke="var(--cy)"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="cdiPerformance"
                    name="CDI"
                    stroke="var(--color-neutral-500)"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {periodFallbackActive && effectiveHistoryWindow && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: 'var(--color-neutral-500)',
                }}>
                Sem dados suficientes para {selectedPeriod} — mostrando os
                últimos {effectiveHistoryWindow.days} dias disponíveis.
              </p>
            )}
            {portfolioSeriesIsFlat && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: 'var(--color-neutral-500)',
                }}>
                A linha da carteira está parada porque as cotações ainda não são
                atualizadas automaticamente.
              </p>
            )}
            {comparisonChartData.length < 2 && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: 'var(--color-neutral-500)',
                }}>
                Histórico insuficiente para comparação de rendimento no período.
              </p>
            )}
          </div>
        </section>

        <section
          style={{
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'var(--nk-card)',
            display: 'flex',
            flexDirection: 'column',
          }}>
          <SectionHeader title="Alocação" subtitle={allocSub} />
          <div
            style={{
              padding: 16.8,
              display: 'flex',
              flexDirection: 'column',
              gap: 16.8,
            }}>
            {/* Allocation donut chart */}
            <div
              role="img"
              aria-label="Gráfico de alocação por classe de ativo"
              style={{display: 'flex', justifyContent: 'center'}}>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart margin={{top: 4, right: 8, left: 8, bottom: 4}}>
                  <Tooltip
                    content={
                      <CustomTooltip
                        formatter={(value) => [
                          `${Number(value).toFixed(2)}%`,
                          'Alocação',
                        ]}
                      />
                    }
                  />
                  <Pie
                    data={allocationChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={64}
                    paddingAngle={2}
                    strokeWidth={0}>
                    {allocationChartData.map((entry, index) => (
                      <Cell key={`alloc-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Allocation list */}
            <div style={{display: 'flex', flexDirection: 'column', gap: 8.4}}>
              {allocation.map((a) => (
                <div
                  key={a.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8.4,
                    fontSize: 12,
                  }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: a.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{flex: 1, color: 'var(--color-neutral-400)'}}>
                    {a.label}
                  </span>
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--color-neutral-300)',
                    }}>
                    {a.pct}
                  </span>
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--color-neutral-500)',
                    }}>
                    {a.value}
                  </span>
                </div>
              ))}
              {allocation.length === 0 && (
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--color-neutral-600)',
                    textAlign: 'center',
                  }}>
                  Sem dados de alocação disponíveis.
                </p>
              )}
            </div>
            {/*
              Linha do handoff (card Alocação, `showQuant`): o maior desvio da
              política e quanto rebalancear. Só no avançado e só com meta
              configurada — sem ela `largestGapLine` é null.
            */}
            {isAdvancedLevel && largestGapLine && (
              <div
                style={{
                  borderTop: '1px solid var(--hair-soft)',
                  paddingTop: 11.2,
                  fontSize: 11.5,
                  color: 'var(--color-neutral-500)',
                  lineHeight: 1.5,
                }}>
                Desvio do alvo:{' '}
                <span style={{color: 'var(--warn)', fontWeight: 600}}>
                  {largestGapLine.highlight}
                </span>
                {' · '}rebalanceamento sugerido de {largestGapLine.amount}.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 5. IA Insights */}
      <section
        style={{
          border: '1px solid var(--hair)',
          borderRadius: 8,
          background: 'var(--nk-card)',
        }}>
        <SectionHeader
          title="IA Insights"
          subtitle="Gerado pela análise da sua carteira"
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
            gap: 1,
            background: 'var(--hair-soft)',
          }}>
          {insights.map((ins) => (
            <div
              key={ins.id}
              style={{padding: '14px 16.8px', background: 'var(--nk-card)'}}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8.4,
                  marginBottom: 8.4,
                }}>
                <i
                  className={ins.icon}
                  style={{fontSize: 15, color: 'var(--color-accent-300)'}}
                />
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent-300)',
                  }}>
                  {ins.tag}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-neutral-200)',
                  lineHeight: 1.4,
                }}>
                {ins.title}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--color-neutral-500)',
                  lineHeight: 1.5,
                  marginTop: 5.6,
                }}>
                {ins.body}
              </div>
            </div>
          ))}
          {insights.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '14px 16.8px',
                background: 'var(--nk-card)',
                color: 'var(--color-neutral-500)',
                fontSize: 12,
              }}>
              Sincronize a carteira para gerar insights da IA.
            </div>
          )}
        </div>
      </section>

      {/* 6. Próximos dividendos */}
      <section
        style={{
          border: '1px solid var(--hair)',
          borderRadius: 8,
          background: 'var(--nk-card)',
        }}>
        <SectionHeader title="Dividendos próximos" subtitle="Próximos 30 dias" />
        {upcomingDividends.length === 0 ? (
          <div
            style={{
              padding: '14px 16.8px',
              color: 'var(--color-neutral-500)',
              fontSize: 12,
            }}>
            Sem eventos de dividendos futuros nas fontes atuais.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
              gap: 1,
              background: 'var(--hair-soft)',
            }}>
            {upcomingDividends.map((d) => (
              <div
                key={d.symbol}
                style={{padding: '14px 16.8px', background: 'var(--nk-card)'}}>
                <div style={{fontWeight: 600, fontSize: 14}}>{d.symbol}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-neutral-500)',
                    marginTop: 2,
                  }}>
                  {d.type} · {d.comDate}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--pos)',
                    marginTop: 8.4,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                  {d.value}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: 'var(--color-neutral-600)',
                    marginTop: 2,
                  }}>
                  {d.perShare} por ação
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. Posições em destaque */}
      <section
        style={{
          border: '1px solid var(--hair)',
          borderRadius: 8,
          background: 'var(--nk-card)',
        }}>
        <SectionHeader
          title="Posições em destaque"
          action={
            <a
              href="/portfolio"
              style={{fontSize: 11.5, color: 'var(--color-accent-300)'}}>
              Ver portfólio completo →
            </a>
          }
        />
        <DataTable
          minWidth={700}
          columns={[
            {label: 'Ativo'},
            {label: 'Classe'},
            {label: 'Cotação', align: 'right'},
            {label: 'P&L R$', align: 'right'},
            {label: 'P&L %', align: 'right'},
            {label: 'Peso', align: 'right'},
            {label: 'DY', align: 'right'},
          ]}>
          {topPositions.slice(0, 6).map((p) => {
            const pnlPositive = p.returnSinceAvgPrice >= 0;
            return (
              <tr
                key={p.symbol}
                style={{borderTop: '1px solid var(--hair-soft)'}}
                className="hover:bg-[rgba(145,132,217,0.06)]">
                <td style={{padding: '9.8px 16.8px', fontWeight: 600}}>
                  {p.symbol}
                </td>
                <td
                  style={{
                    padding: '9.8px 16.8px',
                    color: 'var(--color-neutral-500)',
                    fontSize: 11.5,
                  }}>
                  {classLabel(p.type)}
                </td>
                <td
                  style={{
                    padding: '9.8px 16.8px',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                  {formatCurrency(p.price)}
                </td>
                <td
                  style={{
                    padding: '9.8px 16.8px',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    color: pnlPositive ? 'var(--pos)' : 'var(--neg)',
                    fontWeight: 600,
                  }}>
                  {p.returnSinceAvgPrice !== 0
                    ? `${pnlPositive ? '+' : ''}${formatCurrency(Math.abs(p.value - p.value / (1 + p.returnSinceAvgPrice / 100)))}`
                    : '—'}
                </td>
                <td
                  style={{
                    padding: '9.8px 16.8px',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    color: pnlPositive ? 'var(--pos)' : 'var(--neg)',
                  }}>
                  {p.returnSinceAvgPrice !== 0
                    ? `${pnlPositive ? '+' : ''}${p.returnSinceAvgPrice.toFixed(2)}%`
                    : '—'}
                </td>
                <td
                  style={{
                    padding: '9.8px 16.8px',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--color-neutral-400)',
                  }}>
                  {p.allocation.toFixed(1)}%
                </td>
                <td
                  style={{
                    padding: '9.8px 16.8px',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--color-neutral-300)',
                  }}>
                  {p.dividendYield && p.dividendYield > 0
                    ? `${p.dividendYield.toFixed(2)}%`
                    : '—'}
                </td>
              </tr>
            );
          })}
          {topPositions.length === 0 && (
            <tr>
              <td
                colSpan={7}
                style={{
                  padding: '14px 16.8px',
                  color: 'var(--color-neutral-500)',
                  fontSize: 12,
                  textAlign: 'center',
                }}>
                Nenhum ativo encontrado. Sincronize a carteira.
              </td>
            </tr>
          )}
        </DataTable>
      </section>
    </div>
  );
};

export default Dashboard;
