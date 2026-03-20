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
  ChevronRight,
  CircleDollarSign,
  Star,
  Wallet,
} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import {Skeleton} from '@/components/ui/skeleton';
import {Button} from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [openFiscalIntro, setOpenFiscalIntro] = useState(false);

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
    const key = 'dashboard_fiscal_optimizer_intro_v1';
    const hasSeen = localStorage.getItem(key) === '1';
    if (!hasSeen) {
      setOpenFiscalIntro(true);
    }
  }, []);

  const apiAssets = useMemo(() => {
    if (!portfolioPayload) return [];
    if (Array.isArray(portfolioPayload)) return portfolioPayload;
    return portfolioPayload.assets ?? [];
  }, [portfolioPayload]);

  useEffect(() => {
    if (loading) return;

    // Calcular resumo a partir dos ativos reais
    const totalValue = apiAssets.reduce(
      (sum: number, asset: any) => sum + (asset.total || 0),
      0,
    );

    const totalCost = apiAssets.reduce(
      (sum: number, asset: any) => sum + ((asset.averagePrice || 0) * (asset.quantity || 0)),
      0,
    );

    const profitLoss = totalValue - totalCost;
    const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

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
        type: asset.type === 'fii' ? 'fii' : asset.type === 'stock' ? 'stock' : 'other',
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
            date: new Date(item.date).toLocaleDateString('pt-BR'),
            value: item.totalValue ?? 0,
          }))
        : Array.from({length: 30}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return {
              date: date.toLocaleDateString('pt-BR'),
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
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    };

    const mappedAssets: Asset[] = apiAssets.map((a: any) => {
      const cost = (a.averagePrice || 0) * (a.quantity || 0);
      const val = a.total || 0;
      const pnl = val - cost;
      const pnlPerc = cost > 0 ? (pnl / cost) * 100 : 0;

      return {
        id: a.id || a._id,
        symbol: a.symbol,
        name: a.longName || a.symbol,
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
          color: ALLOCATION_COLORS.stocks,
        },
        {
          name: 'Cripto',
          value: summary.distribution.crypto,
          color: ALLOCATION_COLORS.crypto,
        },
        {
          name: 'FIIs',
          value: summary.distribution.fiis,
          color: ALLOCATION_COLORS.fiis,
        },
        {
          name: 'Outros',
          value: summary.distribution.other,
          color: ALLOCATION_COLORS.other,
        },
      ]
    : [];

  const hasDividends = summary && summary.totalDividends > 0;
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

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select
          value={selectedPortfolioId || ''}
          onValueChange={setSelectedPortfolioId}
        >
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

      <AlertDialog
        open={openFiscalIntro}
        onOpenChange={(open) => {
          setOpenFiscalIntro(open);
          if (!open) {
            localStorage.setItem('dashboard_fiscal_optimizer_intro_v1', '1');
          }
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Novo: Otimizador Fiscal</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <p>
                O sistema detecta oportunidades para reduzir imposto com
                compensação de prejuízos (tax-loss harvesting).
              </p>
              <p>
                Exemplo: se você tem prejuízo acumulado e vender um ativo com
                lucro, esse prejuízo pode zerar ou reduzir o imposto da
                operação.
              </p>
              <p>
                Você verá essas oportunidades no card de Otimizador Fiscal
                abaixo.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="mb-8 card-gradient">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Otimizador Fiscal</CardTitle>
              <CardDescription>
                Oportunidades para reduzir imposto com prejuízo acumulado
              </CardDescription>
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
                    <div key={item.symbol} className="rounded border p-3 text-sm">
                      <p className="font-medium">{item.headline}</p>
                      <p className="text-muted-foreground">
                        Imposto sem compensação:{' '}
                        {formatCurrency(item.estimatedTaxWithoutOffset)} | com
                        compensação:{' '}
                        {formatCurrency(item.estimatedTaxWithOffset)} | economia:{' '}
                        {formatCurrency(item.taxSaved)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-2 card-gradient">
          <CardHeader className="pb-2">
            <CardTitle>Resumo da Carteira</CardTitle>
            <CardDescription>
              Visão geral dos seus investimentos
            </CardDescription>
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
                  <div className="flex items-center">
                    {(summary?.change24h || 0) >= 0 ? (
                      <ArrowUp className="h-5 w-5 text-success" />
                    ) : (
                      <ArrowDown className="h-5 w-5 text-destructive" />
                    )}
                    <span
                      className={`ml-1 ${
                        (summary?.change24h || 0) >= 0
                          ? 'text-success'
                          : 'text-destructive'
                      }`}>
                      {formatCurrency(Math.abs(summary?.change24h || 0))} (
                      {Math.abs(summary?.changePercentage24h || 0).toFixed(2)}%)
                    </span>
                    <span className="ml-2 text-muted-foreground">P&L Total</span>
                  </div>
                </div>

                <div className="h-48 mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={summary?.history}
                      margin={{top: 5, right: 5, left: 5, bottom: 5}}>
                      <defs>
                        <linearGradient
                          id="colorValue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1">
                          <stop
                            offset="5%"
                            stopColor="#22c55e"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#22c55e"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{fontSize: 12}}
                        tickFormatter={(value) => value.slice(5)}
                      />
                      <YAxis
                        tick={{fontSize: 12}}
                        tickFormatter={(value) =>
                          `R$${(value / 1000).toFixed(1)}k`
                        }
                      />
                      <Tooltip
                        formatter={(value) => [
                          formatCurrency(Number(value)),
                          'Valor',
                        ]}
                        labelFormatter={(label) =>
                          new Date(label).toLocaleDateString('pt-BR')
                        }
                        content={
                          <CustomTooltip
                            formatter={(value) => [
                              formatCurrency(Number(value)),
                              'Valor da Carteira',
                            ]}
                            labelFormatter={(label) =>
                              new Date(label).toLocaleDateString('pt-BR', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            }
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="card-gradient">
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
                    <BarChart data={distributionData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        scale="band"
                        width={80}
                        tick={{fontSize: 14}}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}%`, 'Alocação']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                        {distributionData.map((entry, index) => (
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
      <Card className="mb-8 card-gradient">
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
                      <CircleDollarSign className="h-6 w-6 text-green-500" />
                      <h3 className="text-2xl font-bold text-primary">
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
                        <TableRow key={`${dividend.symbol}-${dividend.date}`}>
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
                <a
                  href="/dividends"
                  className="text-primary hover:underline flex items-center text-sm">
                  <span className="mr-1">Ver histórico completo</span>
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets */}
      <Card className="mb-8 card-gradient">
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
                <div className="space-y-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/70 transition-colors cursor-pointer"
                      onClick={() => handleAssetClick(asset)}>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{asset.symbol}</h4>
                          <p className="text-sm text-muted-foreground">
                            {asset.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 mx-10">
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Alocação</span>
                          <span>{asset.allocation}%</span>
                        </div>
                        <Progress value={asset.allocation} className="h-2" />
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(asset.value)}
                        </p>
                        <p
                          className={`text-sm ${
                            asset.change24h >= 0
                              ? 'text-success'
                              : 'text-destructive'
                          }`}>
                          {asset.change24h >= 0 ? '+' : ''}
                          {asset.change24h.toFixed(2)}%
                        </p>
                        {asset.dividendYield && (
                          <p className="text-xs text-muted-foreground">
                            Dividend: {asset.dividendYield.toFixed(2)}%
                          </p>
                        )}
                      </div>
                      <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="stocks">
              <div className="space-y-4">
                {assets
                  .filter((asset) => asset.type === 'stock')
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/70 transition-colors cursor-pointer"
                      onClick={() => handleAssetClick(asset)}>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{asset.symbol}</h4>
                          <p className="text-sm text-muted-foreground">
                            {asset.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 mx-10">
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Alocação</span>
                          <span>{asset.allocation}%</span>
                        </div>
                        <Progress value={asset.allocation} className="h-2" />
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(asset.value)}
                        </p>
                        <p
                          className={`text-sm ${
                            asset.change24h >= 0
                              ? 'text-success'
                              : 'text-destructive'
                          }`}>
                          {asset.change24h >= 0 ? '+' : ''}
                          {asset.change24h.toFixed(2)}%
                        </p>
                      </div>
                      <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
              </div>
            </TabsContent>
            <TabsContent value="crypto">
              <div className="space-y-4">
                {assets
                  .filter((asset) => asset.type === 'crypto')
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/70 transition-colors cursor-pointer"
                      onClick={() => handleAssetClick(asset)}>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{asset.symbol}</h4>
                          <p className="text-sm text-muted-foreground">
                            {asset.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 mx-10">
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Alocação</span>
                          <span>{asset.allocation}%</span>
                        </div>
                        <Progress value={asset.allocation} className="h-2" />
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(asset.value)}
                        </p>
                        <p
                          className={`text-sm ${
                            asset.change24h >= 0
                              ? 'text-success'
                              : 'text-destructive'
                          }`}>
                          {asset.change24h >= 0 ? '+' : ''}
                          {asset.change24h.toFixed(2)}%
                        </p>
                      </div>
                      <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
              </div>
            </TabsContent>
            <TabsContent value="fii">
              <div className="space-y-4">
                {assets
                  .filter((asset) => asset.type === 'fii')
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/70 transition-colors cursor-pointer"
                      onClick={() => handleAssetClick(asset)}>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                          <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{asset.symbol}</h4>
                          <p className="text-sm text-muted-foreground">
                            {asset.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 mx-10">
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Alocação</span>
                          <span>{asset.allocation}%</span>
                        </div>
                        <Progress value={asset.allocation} className="h-2" />
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(asset.value)}
                        </p>
                        <p
                          className={`text-sm ${
                            asset.change24h >= 0
                              ? 'text-success'
                              : 'text-destructive'
                          }`}>
                          {asset.change24h >= 0 ? '+' : ''}
                          {asset.change24h.toFixed(2)}%
                        </p>
                      </div>
                      <ChevronRight className="ml-2 h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Insights Preview */}
      <Card className="card-gradient">
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
