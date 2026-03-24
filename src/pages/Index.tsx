import {useEffect, useMemo, useState} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import portfolioService from '@/services/portfolio';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {fiscalService, stockServices} from '@/server/api/api';
import {
  AlertTriangle,
  Brain,
  CalendarClock,
  ShieldAlert,
  Target,
} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import {Button} from '@/components/ui/button';
import {FeatureTourModal} from '@/components/ui/feature-tour-modal';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {formatCurrency} from '@/utils';
import {CustomTooltip} from '@/components/ui/custom-tooltip';
import {PremiumBlur} from '@/components/ui/premium-blur';
import {useSubscription} from '@/hooks/useSubscription';
import {
  buildAiCacheSignature,
  deriveDashboardHighlights,
  extractAssetRecommendationsFromAnalysis,
  getAiPlanFromPlanName,
  getOrCreateAiAnalysis,
  isProOrHigherPlan,
} from '@/services/ai/trakkerAi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  amount: number;
  value: number;
  allocation: number;
  type: 'stock' | 'crypto' | 'fii' | 'etf' | 'fund' | 'other';
  dividendYield?: number;
  dividendHistory?: {date: string; value: number}[];
}

interface PortfolioSummary {
  totalValue: number;
  totalPnl: number;
  totalPnlPercentage: number;
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
  stocks: '#22c55e',
  crypto: '#3b82f6',
  fiis: '#8b5cf6',
  other: '#f59e0b',
};

const parseHistoryDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

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

const getAveragePrice = (asset: any): number =>
  Number(asset?.averagePrice ?? asset?.average_price ?? 0);

const computeDailyVolatility = (
  history: {date: string; value: number}[],
): number | null => {
  if (history.length < 3) return null;

  const returns: number[] = [];
  for (let i = 1; i < history.length; i += 1) {
    const previous = Number(history[i - 1]?.value || 0);
    const current = Number(history[i]?.value || 0);
    if (previous <= 0 || current <= 0) continue;
    returns.push((current - previous) / previous);
  }

  if (returns.length < 2) return null;

  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (returns.length - 1);
  return Math.sqrt(variance) * 100;
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

const PERIOD_TO_BRAPI_RANGE: Record<string, string> = {
  '7D': '5d',
  '1M': '1mo',
  '3M': '3mo',
  '6M': '6mo',
  '1A': '1y',
  '5A': '5y',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const {planName, isSubscribed, isLoading: loadingSubscription} =
    useSubscription();
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

  const {data: portfolioPayload, isLoading: loading} = useQuery({
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
      const [dollarResponse, ibovResponse, btcResponse, cdiResponse] = await Promise.allSettled(
        [
          stockServices.getNationalStock('USDBRL=X'),
          stockServices.getNationalStock('^BVSP'),
          stockServices.getNationalStock('BTC-USD'),
          stockServices.getCdiRate(),
        ],
      );

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

  const {data: benchmarkHistory} = useQuery({
    queryKey: ['dashboard-benchmark-history', selectedPeriod],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const range = PERIOD_TO_BRAPI_RANGE[selectedPeriod] || '1mo';
      const [ibovHistoryResponse, btcHistoryResponse] = await Promise.allSettled([
        stockServices.getNationalStock('^BVSP', {range, interval: '1d'}),
        stockServices.getNationalStock('BTC-USD', {range, interval: '1d'}),
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
          .sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)));
      };

      return {
        ibov:
          ibovHistoryResponse.status === 'fulfilled'
            ? parseHistory(ibovHistoryResponse.value.data)
            : [],
        btc:
          btcHistoryResponse.status === 'fulfilled'
            ? parseHistory(btcHistoryResponse.value.data)
            : [],
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

    const profitLoss = totalValue - totalCost;
    const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    const calculateAllocation = (type: string) => {
      if (totalValue === 0) return 0;
      const typeTotal = apiAssets
        .filter((a: any) => {
          if (type === 'other') return !['stock', 'crypto', 'fii'].includes(a.type);
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
          asset.type === 'fii' ? 'fii' : asset.type === 'stock' ? 'stock' : 'other',
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
          (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .slice(0, 10),
      dividendEntries: dividendEntries.sort(
        (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    };
  }, [apiAssets, portfolioHistory, selectedPortfolioId]);

  const assets = useMemo<Asset[]>(() => {
    const totalValue = summary.totalValue;
    return apiAssets.map((a: any) => {
      const cost = getAveragePrice(a) * Number(a.quantity || 0);
      const val = a.total || 0;
      const pnl = val - cost;
      const pnlPerc = cost > 0 ? (pnl / cost) * 100 : 0;

      return {
        id: a.id || a._id,
        symbol: a.symbol,
        name: a.name || a.longName || a.symbol,
        price: a.price,
        change24h: pnlPerc,
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
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(dividend.value || 0));
    }

    return months.map((key) => ({
      month: key,
      label: formatMonthYear(`${key}-01`),
      value: monthlyMap.get(key) || 0,
    }));
  }, [summary.dividendEntries]);

  const totalDividendsYear = useMemo(
    () =>
      dividendMonthlyData.reduce((sum, month) => sum + Number(month.value || 0), 0),
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
    summary.totalValue > 0 ? (totalDividendsYear / summary.totalValue) * 100 : null;

  const topPositions = useMemo(
    () => [...assets].sort((a, b) => b.value - a.value).slice(0, 5),
    [assets],
  );
  const topGainers = useMemo(
    () =>
      [...assets]
        .filter((item) => item.change24h > 0)
        .sort((a, b) => b.change24h - a.change24h)
        .slice(0, 3),
    [assets],
  );
  const topLosers = useMemo(
    () =>
      [...assets]
        .filter((item) => item.change24h < 0)
        .sort((a, b) => a.change24h - b.change24h)
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
  const aiSignature = useMemo(() => buildAiCacheSignature(apiAssets), [apiAssets]);

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

  const targetAllocation = useMemo(() => {
    try {
      const raw = localStorage.getItem('portfolio_target_allocation');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed as Partial<Record<'stocks' | 'crypto' | 'fiis' | 'other', number>>;
    } catch {
      return null;
    }
  }, []);

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

    if ((summary.totalPnlPercentage || 0) < -0.5) {
      const biggestDrop = topLosers[0];
      insights.push({
        priority: 'Alta',
        title: 'Queda relevante na carteira hoje',
        description: biggestDrop
          ? `A carteira está abaixo do custo médio em ${Math.abs(summary.totalPnlPercentage).toFixed(2)}%, com destaque para ${biggestDrop.symbol} (${biggestDrop.change24h.toFixed(2)}%).`
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
      const best = optimizerData?.opportunities?.slice().sort((a, b) => b.taxSaved - a.taxSaved)[0];
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
        description: 'No cenário atual, não há oportunidade fiscal clara com os dados disponíveis.',
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
        description: 'Sincronize carteira e histórico para gerar ações mais específicas.',
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
        reason: `Queda de ${Math.abs(topLosers[0].change24h).toFixed(2)}% no período.`,
      });
    }

    if (topGainers.length > 0) {
      actions.push({
        title: `Atualizar plano para ${topGainers[0].symbol}`,
        reason: `Alta de ${topGainers[0].change24h.toFixed(2)}% no período.`,
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
        colorClass: 'text-sky-500',
      },
      {
        key: 'ibov',
        label: 'IBOV',
        value: marketComparators?.ibov?.value ?? null,
        variationPct: marketComparators?.ibov?.variationPct ?? null,
        colorClass: 'text-amber-500',
      },
      {
        key: 'cdi',
        label: 'CDI',
        value: marketComparators?.cdi?.value ?? null,
        variationPct: marketComparators?.cdi?.variationPct ?? null,
        colorClass: 'text-emerald-500',
      },
    ],
    [marketComparators, summary.totalPnlPercentage, summary.totalValue],
  );

  const historyByPeriod = useMemo(() => {
    const history = summary.history || [];
    const daysMap: Record<string, number> = {
      '7D': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1A': 365,
      '5A': 1825,
    };
    const limitDays = daysMap[selectedPeriod] || 30;
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - limitDays);
    const filtered = history.filter((item) => {
      const parsed = parseHistoryDate(item.date);
      return parsed ? parsed >= threshold : false;
    });
    return filtered.length > 1 ? filtered : history;
  }, [selectedPeriod, summary.history]);

  const comparisonChartData = useMemo(() => {
    if (!historyByPeriod || historyByPeriod.length < 2) return [];

    const sortedPortfolio = [...historyByPeriod].sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
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

    const firstIbovComparablePoint = sortedPortfolio.find((point) => {
      const isoDate = toIsoDate(point.date);
      if (!isoDate) return false;
      const ibovValue = ibovMap.get(isoDate);
      return (
        Number.isFinite(Number(ibovValue)) &&
        Number(ibovValue) > 0
      );
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

    return sortedPortfolio.map((point) => {
      const isoDate = toIsoDate(point.date);
      const portfolioPerformance = ((Number(point.value) / portfolioBase) - 1) * 100;
      const ibovValue = isoDate ? ibovMap.get(isoDate) : undefined;
      const btcValue = isoDate ? btcMap.get(isoDate) : undefined;

      return {
        date: point.date,
        portfolioPerformance: Number.isFinite(portfolioPerformance)
          ? portfolioPerformance
          : null,
        ibovPerformance:
          firstIbovValue && ibovValue && ibovValue > 0
            ? ((ibovValue / firstIbovValue) - 1) * 100
            : null,
        btcPerformance:
          firstBtcValue && btcValue && btcValue > 0
            ? ((btcValue / firstBtcValue) - 1) * 100
            : null,
      };
    });
  }, [benchmarkHistory?.btc, benchmarkHistory?.ibov, historyByPeriod]);

  const comparisonAvailability = useMemo(
    () => ({
      hasIbov: comparisonChartData.some(
        (point) => point.ibovPerformance !== null,
      ),
      hasBtc: comparisonChartData.some(
        (point) => point.btcPerformance !== null,
      ),
    }),
    [comparisonChartData],
  );

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

  const formatComparatorValue = (item: MarketComparator): string => {
    if (item.value === null) return 'Dados indisponíveis';
    if (item.key === 'ibov') return `${item.value.toLocaleString('pt-BR')} pts`;
    if (item.key === 'dollar') return `${formatCurrency(item.value)}`;
    if (item.key === 'cdi') return `${item.value.toFixed(4)}% a.d.`;
    if (item.key === 'portfolio') return formatCurrency(item.value);
    return item.value.toLocaleString('pt-BR');
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select value={selectedPortfolioId || ''} onValueChange={setSelectedPortfolioId}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Selecione a carteira" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Carteiras</SelectItem>
            {portfolios.map((p: any) => (
              <SelectItem key={p.id || p._id} value={p.id || p._id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FeatureTourModal
        open={openFeatureTour}
        onOpenChange={setOpenFeatureTour}
        heading="Conheca as novidades"
        subheading="Recursos que melhoram suas decisoes"
        items={[
          {
            title: 'Investment Score',
            description:
              'Uma nota de 0-100 baseada em diversificacao, risco e consistencia, visivel na pagina de Insights.',
          },
          {
            title: 'Simulador de Futuro',
            description:
              'Agora voce pode simular aportes mensais e ver projecoes em cenarios otimistas, neutros e pessimistas.',
          },
          {
            title: 'Radar Anti-Erro',
            description:
              'A IA detecta erros de concentracao de setor e correlacao, emitindo alertas preventivos.',
          },
          {
            title: 'Radar de Oportunidades',
            description:
              'Uma lista premium de ativos com potencial de valorizacao baseada na analise da IA.',
          },
          {
            title: 'Opiniao Trackerr IA',
            description:
              'Integrada na pagina de detalhes de cada ativo para entregar um resumo estrategico rapido.',
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

      <Card className="mb-8 overflow-hidden rounded-2xl border border-emerald-300/40 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 dark:border-emerald-400/20 dark:from-emerald-950/40 dark:via-slate-950 dark:to-cyan-950/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-emerald-700 dark:text-emerald-300">Otimizador Fiscal</CardTitle>
              <CardDescription>Oportunidades para reduzir imposto com prejuízo acumulado</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/fiscal')}>
              Abrir Fiscal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingOptimizer ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <>
              <p className="text-sm">
                Prejuízo acumulado disponível: <strong>{formatCurrency(optimizerData?.accumulatedLosses?.total || 0)}</strong>
              </p>
              <p className="text-sm text-muted-foreground">{optimizerData?.explanation}</p>
              {(optimizerData?.opportunities || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem oportunidades claras no momento.</p>
              ) : (
                <div className="space-y-2">
                  {optimizerData?.opportunities?.slice(0, 3).map((item) => (
                    <div key={item.symbol} className="rounded-lg border border-border/40 bg-background/30 p-3 text-sm">
                      <p className="font-medium">{item.headline}</p>
                      <p className="text-muted-foreground">
                        Imposto com compensação: {formatCurrency(item.estimatedTaxWithOffset)} | economia: {formatCurrency(item.taxSaved)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 rounded-2xl bg-gradient-to-br from-card to-card/60 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Patrimônio</CardTitle>
                <CardDescription>Valor consolidado da carteira com comparativos de mercado</CardDescription>
              </div>
              <div className="flex space-x-1 rounded-full bg-secondary/30 p-1">
                {['7D', '1M', '3M', '6M', '1A', '5A'].map((period) => (
                  <Button
                    key={period}
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className={`h-8 rounded-full px-4 text-xs font-bold transition-all ${
                      selectedPeriod === period
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    }`}>
                    {period}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-56" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-44 w-full" />
              </div>
            ) : (
              <>
                <h3 className="mb-2 text-4xl font-bold text-primary animate-value">{formatCurrency(summary.totalValue || 0)}</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  P&L acumulado: {summary.totalPnl >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(summary.totalPnl || 0))} ({summary.totalPnlPercentage >= 0 ? '+' : '-'}
                  {Math.abs(summary.totalPnlPercentage || 0).toFixed(2)}%)
                </p>

                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {marketComparatorCards.map((item) => (
                    <div key={item.key} className="rounded-xl border border-border/50 bg-background/60 p-3">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
                      <p className={`text-sm font-semibold ${item.colorClass}`}>
                        {formatComparatorValue(item)}
                      </p>
                      <p
                        className={`text-xs ${
                          (item.variationPct || 0) > 0
                            ? 'text-emerald-500'
                            : (item.variationPct || 0) < 0
                              ? 'text-rose-500'
                              : 'text-muted-foreground'
                        }`}>
                        {item.variationPct !== null
                          ? `${item.variationPct >= 0 ? '+' : ''}${item.variationPct.toFixed(2)}%`
                          : 'Sem variação disponível'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={comparisonChartData} margin={{top: 10, right: 8, left: 0, bottom: 0}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.15)" />
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
                      <Legend
                        verticalAlign="top"
                        align="left"
                        iconType="circle"
                        wrapperStyle={{fontSize: 11}}
                        formatter={(value) =>
                          value === 'IBOV' && !comparisonAvailability.hasIbov
                            ? 'IBOV (indisponível no período)'
                            : value === 'BTC' && !comparisonAvailability.hasBtc
                              ? 'BTC (indisponível no período)'
                              : value
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="portfolioPerformance"
                        name="Carteira"
                        stroke="#22c55e"
                        strokeWidth={2.5}
                        fillOpacity={0.12}
                        fill="#22c55e"
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="ibovPerformance"
                        name="IBOV"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="btcPerformance"
                        name="BTC"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                {comparisonChartData.length < 2 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Histórico insuficiente para comparação de rendimento no período.
                  </p>
                )}
                {comparisonChartData.length >= 2 &&
                  (!comparisonAvailability.hasIbov ||
                    !comparisonAvailability.hasBtc) && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {!comparisonAvailability.hasIbov
                        ? 'IBOV sem histórico comparável neste período. '
                        : ''}
                      {!comparisonAvailability.hasBtc
                        ? 'BTC sem histórico comparável neste período.'
                        : ''}
                    </p>
                  )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card/40 border-primary/5 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Alocação com contexto
            </CardTitle>
            <CardDescription>Comparação com meta e alerta de concentração</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : (
              <>
                <div className="mb-4 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allocationChartData} layout="vertical" margin={{top: 8, right: 10, left: 10, bottom: 8}}>
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{fontSize: 11, fill: 'hsl(var(--muted-foreground))'}} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" width={72} tick={{fontSize: 12, fill: 'hsl(var(--foreground))'}} axisLine={false} tickLine={false} />
                      <Tooltip
                        content={
                          <CustomTooltip
                            formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Alocação']}
                          />
                        }
                      />
                      <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={18}>
                        {allocationChartData.map((entry, index) => (
                          <Cell key={`allocation-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {allocationContext.map((row) => (
                    <div key={row.label} className="rounded-lg border border-border/40 p-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{row.label}</span>
                        <span>{row.current.toFixed(2)}%</span>
                      </div>
                      {row.target !== null ? (
                        <p className={`text-xs ${row.delta && row.delta > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {row.delta && row.delta > 0 ? 'Acima' : 'Abaixo'} da meta em {Math.abs(row.delta || 0).toFixed(2)}% (meta {row.target.toFixed(2)}%)
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Meta de alocação não configurada.</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border border-sky-300/40 bg-gradient-to-r from-sky-50 via-white to-indigo-50 dark:border-sky-400/20 dark:from-blue-950/40 dark:via-slate-950 dark:to-indigo-950/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                  <Brain className="h-5 w-5 text-primary" />
                  Trackerr IA Hoje
                </CardTitle>
                <CardDescription>Prioridades práticas para hoje com base no portfólio atual</CardDescription>
              </div>
              {!hasProOrHigher && (
                <Button variant="outline" size="sm" onClick={() => navigate('/subscription')}>
                  Upgrade PRO
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingSubscription ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <PremiumBlur
                locked={!hasProOrHigher}
                title="Insights exclusivos para PRO+"
                description="Faça upgrade para liberar alertas diários da Trackerr IA com base nos seus dados reais.">
                <div className="space-y-3">
                  {actionableInsights.map((item, idx) => (
                    <div key={`${item.title}-${idx}`} className="rounded-lg border border-border/40 bg-background/70 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            item.priority === 'Alta'
                              ? 'bg-rose-500/15 text-rose-500'
                              : item.priority === 'Média'
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-emerald-500/15 text-emerald-500'
                          }`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                  {dashboardHighlights.length > 0 && (
                    <div className="rounded-lg border border-border/40 bg-background/70 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Sinais de watchlist e cenário
                      </p>
                      <div className="space-y-1">
                        {dashboardHighlights.map((item, idx) => (
                          <p key={`${item.title}-${idx}`} className="text-xs text-muted-foreground">
                            {item.title}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PremiumBlur>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-primary/10 bg-card/50 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Próximas ações recomendadas
            </CardTitle>
            <CardDescription>Ações priorizadas para manter a carteira saudável</CardDescription>
          </CardHeader>
          <CardContent>
            {recommendedActions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem ações pendentes com os dados atuais.</p>
            ) : (
              <div className="space-y-3">
                {recommendedActions.map((item) => (
                  <div key={item.title} className="rounded-lg border border-border/40 bg-background/60 p-3">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl border border-primary/10 bg-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Risco da carteira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center justify-between">
              <span>Volatilidade diária</span>
              <strong>{volatilityPct !== null ? `${volatilityPct.toFixed(2)}%` : 'Dados insuficientes'}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span>Maior concentração</span>
              <strong>
                {concentrationInfo
                  ? `${concentrationInfo.name} (${concentrationInfo.value.toFixed(2)}%)`
                  : 'Sem dados'}
              </strong>
            </p>
            <p className="flex items-center justify-between">
              <span>Exposição por classe</span>
              <strong>{distributionData.filter((d) => d.value > 0).length} classes</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Correlação detalhada entre ativos ainda não está disponível na API atual.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-primary/10 bg-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Próximos eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {futureDividendEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem eventos futuros disponíveis nas fontes atuais.
              </p>
            ) : (
              <div className="space-y-2">
                {futureDividendEvents.map((event) => (
                  <div key={`${event.symbol}-${event.date}`} className="rounded-lg border border-border/40 p-2 text-sm">
                    <p className="font-medium">{event.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      Provento previsto: {formatCurrency(event.value)} em {formatHistoryDate(event.date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-primary/10 bg-card/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Performance vs benchmark
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {benchmarkCards.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/40 p-2 text-sm">
                <span>{item.label}</span>
                <strong
                  className={
                    item.value === null
                      ? 'text-muted-foreground'
                      : item.value >= 0
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                  }>
                  {item.value === null
                    ? 'Indisponível'
                    : `${item.value >= 0 ? '+' : ''}${item.value.toFixed(2)}%`}
                </strong>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Dividendos</CardTitle>
          <CardDescription>Total no ano, média mensal, próximo pagamento e yield estimado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total no ano</p>
              <p className="text-lg font-semibold">{formatCurrency(totalDividendsYear)}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Média mensal</p>
              <p className="text-lg font-semibold">{formatCurrency(dividendMonthlyAverage)}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Próximo pagamento</p>
              <p className="text-sm font-semibold">
                {nextDividend
                  ? `${nextDividend.symbol} • ${formatHistoryDate(nextDividend.date)}`
                  : 'Sem previsão nos dados atuais'}
              </p>
            </div>
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Yield estimado</p>
              <p className="text-lg font-semibold">
                {estimatedDividendYieldPct !== null
                  ? `${estimatedDividendYieldPct.toFixed(2)}%`
                  : 'Indisponível'}
              </p>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dividendMonthlyData} margin={{top: 8, right: 8, left: 8, bottom: 8}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.15)" />
                <XAxis dataKey="label" tick={{fontSize: 11}} />
                <YAxis tickFormatter={(value) => formatCurrency(Number(value))} width={90} tick={{fontSize: 11}} />
                <Tooltip
                  content={
                    <CustomTooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Dividendos']}
                      labelFormatter={(label) => String(label)}
                    />
                  }
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Ativos em foco</CardTitle>
          <CardDescription>Top posições, maiores altas/quedas e oportunidades</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border/40 p-3">
            <h4 className="mb-2 text-sm font-semibold">Top 5 maiores posições</h4>
            {topPositions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem ativos carregados.</p>
            ) : (
              <div className="space-y-2">
                {topPositions.map((asset) => (
                  <button
                    type="button"
                    key={`position-${asset.id}`}
                    className="flex w-full items-center justify-between text-left text-sm hover:text-primary"
                    onClick={() => navigate(`/portfolio/asset/${asset.id}`)}>
                    <span>{asset.symbol}</span>
                    <span className="font-semibold">{formatCurrency(asset.value)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/40 p-3">
            <h4 className="mb-2 text-sm font-semibold">Top 3 maiores altas</h4>
            {topGainers.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem altas no período.</p>
            ) : (
              <div className="space-y-2">
                {topGainers.map((asset) => (
                  <p key={`gainer-${asset.id}`} className="flex items-center justify-between text-sm">
                    <span>{asset.symbol}</span>
                    <span className="font-semibold text-emerald-500">+{asset.change24h.toFixed(2)}%</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/40 p-3">
            <h4 className="mb-2 text-sm font-semibold">Top 3 maiores quedas</h4>
            {topLosers.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem quedas no período.</p>
            ) : (
              <div className="space-y-2">
                {topLosers.map((asset) => (
                  <p key={`loser-${asset.id}`} className="flex items-center justify-between text-sm">
                    <span>{asset.symbol}</span>
                    <span className="font-semibold text-rose-500">{asset.change24h.toFixed(2)}%</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border/40 p-3">
            <h4 className="mb-2 text-sm font-semibold">Top 3 oportunidades</h4>
            {visibleOpportunities.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem oportunidade clara nos dados atuais.</p>
            ) : (
              <div className="space-y-2">
                {visibleOpportunities.slice(0, 3).map((item) => (
                  <p key={item.key} className="text-sm">
                    <span className="font-semibold">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">{item.subtitle}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-primary/10 bg-card/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Resumo fiscal do mês
          </CardTitle>
          <CardDescription>Baseado no otimizador fiscal atual</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-border/40 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Vendas do mês</p>
            <p className="text-sm font-semibold">Disponível na tela Fiscal</p>
          </div>
          <div className="rounded-lg border border-border/40 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Lucro acumulado</p>
            <p className="text-sm font-semibold">{formatCurrency(summary.totalPnl || 0)}</p>
          </div>
          <div className="rounded-lg border border-border/40 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Prejuízo compensável</p>
            <p className="text-sm font-semibold">{formatCurrency(optimizerData?.accumulatedLosses?.total || 0)}</p>
          </div>
          <div className="rounded-lg border border-border/40 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Imposto potencial</p>
            <p className="text-sm font-semibold">
              {optimizerData?.opportunities?.length
                ? formatCurrency(
                    optimizerData.opportunities.reduce(
                      (sum, item) => sum + Number(item.estimatedTaxWithOffset || 0),
                      0,
                    ),
                  )
                : 'Sem estimativa'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
