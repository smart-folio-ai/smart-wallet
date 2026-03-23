import {useEffect, useMemo, useState} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import portfolioService from '@/services/portfolio';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {fiscalService} from '@/server/api/api';
import {
  ArrowDown,
  ArrowUp,
  Brain,
  ChevronRight,
  CircleDollarSign,
  Star,
  Wallet,
} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {Skeleton} from '@/components/ui/skeleton';
import {Button} from '@/components/ui/button';
import {FeatureTourModal} from '@/components/ui/feature-tour-modal';
import {
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {formatCurrency} from '@/utils';
import {CustomTooltip} from '@/components/ui/custom-tooltip';
import {PremiumBlur} from '@/components/ui/premium-blur';
import {useSubscription} from '@/hooks/useSubscription';
import {
  buildAiCacheSignature,
  deriveDashboardHighlights,
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
  lastDividend?: number;
  dividendHistory?: {date: string; value: number}[];
}

interface PortfolioSummary {
  totalValue: number;
  change24h: number;
  changePercentage24h: number;
  totalDividends: number;
  distribution: {
    stocks: number;
    crypto: number;
    fiis: number;
    other: number;
  };
  dividendsByType: {
    stocks: number;
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
}

interface FiscalOptimizerOpportunity {
  symbol: string;
  category: 'stock' | 'fii' | 'crypto';
  potentialGain: number;
  estimatedTaxWithoutOffset: number;
  estimatedTaxWithOffset: number;
  taxSaved: number;
  canZeroTax: boolean;
  headline: string;
}

interface FiscalOptimizerResponse {
  year: number;
  accumulatedLosses: {
    stock: number;
    fii: number;
    crypto: number;
    total: number;
  };
  opportunities: FiscalOptimizerOpportunity[];
  explanation: string;
}

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

const ALLOCATION_COLORS = {
  stocks: '#22c55e',
  crypto: '#3b82f6',
  fiis: '#8b5cf6',
  other: '#f59e0b',
};

const DIVIDEND_COLORS = {
  stocks: '#22c55e',
  fiis: '#8b5cf6',
  other: '#f59e0b',
};

const Dashboard = () => {
  const ASSET_PREVIEW_LIMIT = 5;
  const navigate = useNavigate();
  const {
    planName,
    isSubscribed,
    isLoading: loadingSubscription,
  } = useSubscription();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [openFeatureTour, setOpenFeatureTour] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [showAllHighlights, setShowAllHighlights] = useState(false);
  const [showAllAssetsByTab, setShowAllAssetsByTab] = useState<
    Record<'all' | 'stocks' | 'crypto' | 'fii', boolean>
  >({
    all: false,
    stocks: false,
    crypto: false,
    fii: false,
  });
  const featureTourStorageKey = 'dashboard_feature_tour_seen_v1';

  const handleAssetClick = (asset: Asset) => {
    if (!asset.id) return;
    navigate(`/portfolio/asset/${asset.id}`);
  };

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

  const hasProOrHigher = isProOrHigherPlan(planName, isSubscribed);
  const aiPlan = getAiPlanFromPlanName(planName);
  const aiSignature = useMemo(
    () => buildAiCacheSignature(apiAssets),
    [apiAssets],
  );

  const {data: dashboardAiAnalysis, isLoading: loadingDashboardAi} = useQuery({
    queryKey: ['dashboard-ai-analysis', aiPlan, aiSignature],
    enabled: hasProOrHigher && apiAssets.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () =>
      getOrCreateAiAnalysis({
        rawAssets: apiAssets,
        plan: aiPlan,
      }),
  });

  const dashboardHighlights = useMemo(
    () =>
      deriveDashboardHighlights({
        rawAssets: apiAssets,
        summary,
        analysis: dashboardAiAnalysis || null,
      }).slice(0, 5),
    [apiAssets, summary, dashboardAiAnalysis],
  );
  const visibleDashboardHighlights = showAllHighlights
    ? dashboardHighlights
    : dashboardHighlights.slice(0, 3);

  useEffect(() => {
    if (loading) return;

    // Calcular resumo a partir dos ativos reais
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
    const profitLossPercentage =
      totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    const calculateAllocation = (type: string) => {
      if (totalValue === 0) return 0;
      const typeTotal = apiAssets
        .filter((a: any) => {
          if (type === 'other') {
            return !['stock', 'crypto', 'fii'].includes(a.type);
          }
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

    const dividendsByType = {
      stocks: dividendEntries
        .filter((d: any) => d.type === 'stock')
        .reduce((sum: number, d: any) => sum + (d.value || 0), 0),
      fiis: dividendEntries
        .filter((d: any) => d.type === 'fii')
        .reduce((sum: number, d: any) => sum + (d.value || 0), 0),
      other: dividendEntries
        .filter((d: any) => d.type === 'other')
        .reduce((sum: number, d: any) => sum + (d.value || 0), 0),
    };

    const historyData =
      selectedPortfolioId !== 'all' && portfolioHistory.length > 0
        ? portfolioHistory.map((item: any) => ({
            date: item.date,
            value: item.totalValue ?? 0,
          }))
        : Array.from({length: 30}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return {
              date: date.toISOString(),
              value: totalValue,
            };
          });

    const newSummary: PortfolioSummary = {
      totalValue,
      change24h: profitLoss, // Using Total P&L as 24h change is not directly available
      changePercentage24h: profitLossPercentage,
      totalDividends,
      distribution: {
        stocks: calculateAllocation('stock'),
        crypto: calculateAllocation('crypto'),
        fiis: calculateAllocation('fii'),
        other: calculateAllocation('other'),
      },
      dividendsByType,
      history: historyData,
      lastDividends: dividendEntries
        .sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .slice(0, 5),
    };

    const mappedAssets: Asset[] = apiAssets.map((a: any) => {
      const cost = getAveragePrice(a) * Number(a.quantity || 0);
      const val = a.total || 0;
      const pnl = val - cost;
      const pnlPerc = cost > 0 ? (pnl / cost) * 100 : 0;

      return {
        id: a.id || a._id,
        symbol: a.symbol,
        name: a.name || a.longName || a.symbol,
        price: a.price,
        change24h: pnlPerc, // Showing total asset P%L as change
        amount: a.quantity,
        value: val,
        allocation:
          totalValue > 0 ? Number(((val / totalValue) * 100).toFixed(2)) : 0,
        type: a.type,
        dividendYield: a.indicators?.dividendYield ?? 0,
        lastDividend: 0,
        dividendHistory: a.dividendHistory ?? [],
      };
    });

    setSummary(newSummary);
    setAssets(mappedAssets);
  }, [apiAssets, loading, portfolioHistory, selectedPortfolioId]);

  const distributionData = summary
    ? [
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
      ]
    : [];

  const allocationChartData = [...distributionData]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const hasDividends = summary && summary.totalDividends > 0;
  const assetsByTab = useMemo(
    () => ({
      all: assets,
      stocks: assets.filter((asset) => asset.type === 'stock'),
      crypto: assets.filter((asset) => asset.type === 'crypto'),
      fii: assets.filter((asset) => asset.type === 'fii'),
    }),
    [assets],
  );

  const dividendsByTypeData = hasDividends
    ? [
        {
          name: 'Ações',
          value: summary.dividendsByType.stocks,
          color: DIVIDEND_COLORS.stocks,
        },
        {
          name: 'FIIs',
          value: summary.dividendsByType.fiis,
          color: DIVIDEND_COLORS.fiis,
        },
        {
          name: 'Outros',
          value: summary.dividendsByType.other,
          color: DIVIDEND_COLORS.other,
        },
      ].filter((item) => item.value > 0)
    : [
        {
          name: 'Sem dividendos',
          value: 1,
          color: 'hsl(var(--muted) / 0.5)',
        },
      ];

  const renderAssetRows = (
    tab: 'all' | 'stocks' | 'crypto' | 'fii',
    emptyMessage: string,
  ) => {
    const tabAssets = assetsByTab[tab];
    const showAll = showAllAssetsByTab[tab];
    const visibleAssets = showAll ? tabAssets : tabAssets.slice(0, ASSET_PREVIEW_LIMIT);

    if (tabAssets.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
    }

    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-card/30">
          {visibleAssets.map((asset) => (
            <div
              key={`${tab}-${asset.id}`}
              className="flex cursor-pointer items-center gap-3 border-b border-white/10 px-4 py-3 transition-colors hover:bg-card/60 last:border-b-0"
              onClick={() => handleAssetClick(asset)}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate font-medium">{asset.symbol}</h4>
                  <p className="truncate text-sm text-muted-foreground">{asset.name}</p>
                </div>
              </div>
              <div className="mx-2 hidden flex-1 lg:block">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Alocação</span>
                  <span>{asset.allocation}%</span>
                </div>
                <Progress value={asset.allocation} className="h-2" />
              </div>
              <div className="ml-auto text-right">
                <p className="font-medium">{formatCurrency(asset.value)}</p>
                <p
                  className={`text-sm ${
                    asset.change24h >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                  {asset.change24h >= 0 ? '+' : ''}
                  {asset.change24h.toFixed(2)}%
                </p>
                {asset.dividendYield ? (
                  <p className="text-xs text-muted-foreground">
                    Dividend: {asset.dividendYield.toFixed(2)}%
                  </p>
                ) : null}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          ))}
        </div>
        {tabAssets.length > ASSET_PREVIEW_LIMIT ? (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-semibold text-primary hover:text-primary"
              onClick={() =>
                setShowAllAssetsByTab((prev) => ({
                  ...prev,
                  [tab]: !prev[tab],
                }))
              }>
              {showAll ? 'Ver menos' : 'Ver mais...'}
            </Button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select
          value={selectedPortfolioId || ''}
          onValueChange={setSelectedPortfolioId}>
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
              <CardDescription>
                Oportunidades para reduzir imposto com prejuízo acumulado
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/fiscal')}>
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
                Prejuízo acumulado disponível:{' '}
                <strong>
                  {formatCurrency(optimizerData?.accumulatedLosses?.total || 0)}
                </strong>
              </p>
              <p className="text-sm text-muted-foreground">
                {optimizerData?.explanation}
              </p>
              {(optimizerData?.opportunities || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem oportunidades claras no momento.
                </p>
              ) : (
                <div className="space-y-2">
                  {optimizerData?.opportunities?.slice(0, 3).map((item) => (
                    <div
                      key={item.symbol}
                      className="rounded-lg border border-border/40 bg-background/30 p-3 text-sm">
                      <p className="font-medium">{item.headline}</p>
                      <p className="text-muted-foreground">
                        Imposto sem compensação:{' '}
                        {formatCurrency(item.estimatedTaxWithoutOffset)} | com
                        compensação:{' '}
                        {formatCurrency(item.estimatedTaxWithOffset)} |
                        economia: {formatCurrency(item.taxSaved)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8 overflow-hidden rounded-2xl border border-sky-300/40 bg-gradient-to-r from-sky-50 via-white to-indigo-50 dark:border-sky-400/20 dark:from-blue-950/40 dark:via-slate-950 dark:to-indigo-950/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                <Brain className="h-5 w-5 text-primary" />
                Trackerr IA Hoje
              </CardTitle>
              <CardDescription>
                Alertas e oportunidades personalizados com base na sua carteira
              </CardDescription>
            </div>
            {!hasProOrHigher && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/subscription')}>
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
              {loadingDashboardAi ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : dashboardHighlights.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ainda estamos preparando seus insights do dia. Sincronize seus
                  dados e tente novamente.
                </p>
              ) : (
                <div className="rounded-lg border border-border/40 bg-white/70 px-2 dark:bg-background/20">
                  {visibleDashboardHighlights.map((item, idx) => (
                    <div
                      key={`${item.title}-${idx}`}
                      className="border-b border-white/10 p-3 last:border-b-0">
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.content}
                      </p>
                    </div>
                  ))}
                  {dashboardHighlights.length > 3 && (
                    <div className="flex justify-end border-t border-white/10 px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-semibold text-primary hover:text-primary"
                        onClick={() => setShowAllHighlights((prev) => !prev)}>
                        {showAllHighlights ? 'Ver menos' : 'Ver mais...'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </PremiumBlur>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-2 rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Cotação</CardTitle>
                <CardDescription>
                  Visão geral dos seus investimentos
                </CardDescription>
              </div>
              <div className="flex space-x-1 bg-secondary/30 p-1 rounded-full">
                {['7D', '1M', '3M', '6M', '1A', '5A'].map((period) => (
                  <Button
                    key={period}
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className={`text-xs h-8 rounded-full px-4 font-bold transition-all ${
                      selectedPeriod === period
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
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
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-44 w-full" />
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="text-4xl font-bold mb-2 text-primary animate-value">
                    {formatCurrency(summary?.totalValue || 0)}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-2xl ${
                          (summary?.change24h || 0) >= 0
                            ? 'bg-emerald-500/10'
                            : 'bg-rose-500/10'
                        }`}>
                        {(summary?.change24h || 0) >= 0 ? (
                          <ArrowUp className="h-6 w-6 text-emerald-500" />
                        ) : (
                          <ArrowDown className="h-6 w-6 text-rose-500" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">
                          P&L Total
                        </span>
                        <span
                          className={`font-black text-2xl tracking-tight ${
                            (summary?.change24h || 0) >= 0
                              ? 'text-emerald-500'
                              : 'text-rose-500'
                          }`}>
                          {(summary?.change24h || 0) >= 0 ? '+' : ''}
                          {formatCurrency(Math.abs(summary?.change24h || 0))}
                          <span className="text-sm font-bold ml-2 opacity-80">
                            ({(summary?.change24h || 0) >= 0 ? '+' : ''}
                            {Math.abs(
                              summary?.changePercentage24h || 0,
                            ).toFixed(2)}
                            %)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-48 mt-6">
                  {(() => {
                    const chartData = summary?.history || [];
                    const isPositive =
                      chartData.length >= 2 &&
                      chartData[chartData.length - 1].value >=
                        chartData[0].value;
                    const strokeColor = isPositive ? '#10b981' : '#f43f5e';

                    return (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData}
                          margin={{top: 5, right: 0, left: 0, bottom: 0}}>
                          <defs>
                            <linearGradient
                              id="colorValueDB"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1">
                              <stop
                                offset="5%"
                                stopColor={strokeColor}
                                stopOpacity={0.1}
                              />
                              <stop
                                offset="95%"
                                stopColor={strokeColor}
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="hsl(var(--muted-foreground)/0.15)"
                          />
                          <XAxis dataKey="date" hide />
                          <YAxis hide domain={['auto', 'auto']} />
                          <Tooltip
                            cursor={{
                              stroke: 'hsl(var(--muted-foreground)/0.2)',
                              strokeWidth: 1,
                              strokeDasharray: '3 3',
                            }}
                            formatter={(value) => [
                              formatCurrency(Number(value)),
                              'Valor',
                            ]}
                            labelFormatter={(label) => formatHistoryDate(label)}
                            content={
                              <CustomTooltip
                                formatter={(value) => [
                                  formatCurrency(Number(value)),
                                  'Valor da Carteira',
                                ]}
                                labelFormatter={(label) => {
                                  const parsed = parseHistoryDate(label);
                                  return parsed
                                    ? parsed.toLocaleDateString('pt-BR', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })
                                    : '-';
                                }}
                              />
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={strokeColor}
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="none"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card/40 border-primary/5 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle>Alocação</CardTitle>
            <CardDescription>Distribuição dos seus ativos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-44 w-full rounded-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <>
                <div className="h-48 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={allocationChartData}
                      layout="vertical"
                      margin={{top: 8, right: 10, left: 10, bottom: 8}}>
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        tick={{fontSize: 11, fill: 'hsl(var(--muted-foreground))'}}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        scale="band"
                        width={72}
                        tick={{fontSize: 12, fill: 'hsl(var(--foreground))'}}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={false}
                        shared={false}
                        content={({active, payload}) => {
                          if (!active || !payload?.length) return null;
                          const item: any = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-border/60 bg-background/95 p-3 shadow-xl backdrop-blur">
                              <p className="mb-1 text-sm font-semibold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Alocação: <span className="font-semibold text-foreground">{item.value.toFixed(2)}%</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Valor: <span className="font-semibold text-foreground">{formatCurrency(item.amount || 0)}</span>
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[6, 6, 6, 6]}
                        barSize={18}
                        activeBar={{
                          stroke: 'hsl(var(--foreground) / 0.35)',
                          strokeWidth: 1,
                          fillOpacity: 0.95,
                        }}>
                        {allocationChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {distributionData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{backgroundColor: item.color}}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dividends Card */}
      <Card className="mb-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Dividendos</CardTitle>
          <CardDescription>Resumo dos dividendos recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-44 w-full" />
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 bg-emerald-500/10 rounded-2xl">
                        <CircleDollarSign className="h-6 w-6 text-emerald-500" />
                      </div>
                      <h3 className="text-3xl font-black text-primary">
                        {formatCurrency(summary?.totalDividends || 0)}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total de dividendos recebidos
                    </p>
                  </div>

                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dividendsByTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          nameKey="name"
                          labelLine={
                            hasDividends
                              ? {
                                  stroke: 'hsl(var(--foreground))',
                                  strokeOpacity: 0.2,
                                }
                              : false
                          }
                          label={
                            hasDividends
                              ? (props: any) => {
                                  const {
                                    cx,
                                    cy,
                                    midAngle,
                                    outerRadius,
                                    name,
                                    percent,
                                  } = props;
                                  const RADIAN = Math.PI / 180;
                                  const radius = outerRadius + 15;
                                  const x =
                                    cx + radius * Math.cos(-midAngle * RADIAN);
                                  const y =
                                    cy + radius * Math.sin(-midAngle * RADIAN);
                                  return (
                                    <text
                                      x={x}
                                      y={y}
                                      fill="hsl(var(--foreground))"
                                      textAnchor={x > cx ? 'start' : 'end'}
                                      dominantBaseline="central"
                                      fontSize={12}>
                                      {name} {(percent * 100).toFixed(0)}%
                                    </text>
                                  );
                                }
                              : false
                          }>
                          {dividendsByTypeData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="hsl(var(--background))"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            hasDividends ? formatCurrency(Number(value)) : '0',
                            'Valor',
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-4">Últimos Dividendos Recebidos</h4>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary?.lastDividends.map((dividend) => (
                        <TableRow
                          key={`${dividend.symbol}-${dividend.date}`}
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/dividends/${dividend.symbol}?portfolioId=${
                                selectedPortfolioId || 'all'
                              }`,
                            )
                          }>
                          <TableCell className="font-medium">
                            {new Date(dividend.date).toLocaleDateString(
                              'pt-BR',
                            )}
                          </TableCell>
                          <TableCell>{dividend.symbol}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(dividend.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary"
                  onClick={() =>
                    navigate(`/dividends?portfolioId=${selectedPortfolioId || 'all'}`)
                  }>
                  <span className="mr-1">Ver histórico completo</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets */}
      <Card className="mb-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Ativos</CardTitle>
          <CardDescription>Seus principais investimentos</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="stocks">Ações</TabsTrigger>
              <TabsTrigger value="crypto">Cripto</TabsTrigger>
              <TabsTrigger value="fii">FIIs</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                renderAssetRows('all', 'Nenhum ativo encontrado.')
              )}
            </TabsContent>
            <TabsContent value="stocks">
              {renderAssetRows('stocks', 'Nenhuma ação encontrada.')}
            </TabsContent>
            <TabsContent value="crypto">
              {renderAssetRows('crypto', 'Nenhum criptoativo encontrado.')}
            </TabsContent>
            <TabsContent value="fii">
              {renderAssetRows('fii', 'Nenhum FII encontrado.')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Insights Preview */}
      <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Insights da IA</CardTitle>
              <CardDescription>
                Análises e recomendações personalizadas
              </CardDescription>
            </div>
            <Star className="h-6 w-6 text-yellow-400" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-40" />
            </div>
          ) : (
            <div>
              <div className="bg-card/50 rounded-lg p-4 mb-4">
                <h4 className="font-medium mb-2">Oportunidades Detectadas</h4>
                <p className="text-muted-foreground mb-4">
                  Nossa IA identificou 3 oportunidades com base na sua carteira
                  atual e nas condições de mercado. Upgrade para o plano Premium
                  para ver detalhes completos.
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-yellow-500">
                    <span className="mr-1">PETR4</span>
                    <span>•</span>
                    <span className="mx-1">VALE3</span>
                    <span>•</span>
                    <span className="ml-1">BTC</span>
                  </div>
                  <span className="text-muted-foreground">Preview</span>
                </div>
              </div>
              <div className="flex justify-end">
                <a
                  href="/ai-insights"
                  className="text-primary hover:underline flex items-center">
                  <span className="mr-1">Ver todos os insights</span>
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
