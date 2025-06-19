import {useEffect, useState} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
// import {portfolioService} from '@/server/api/api';
import {useToast} from '@/hooks/use-toast';
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

interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  amount: number;
  value: number;
  allocation: number;
  type: 'stock' | 'crypto' | 'fii' | 'other';
  dividendYield?: number;
  lastDividend?: number;
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

const mockSummary: PortfolioSummary = {
  totalValue: 25430.75,
  change24h: 452.3,
  changePercentage24h: 1.81,
  totalDividends: 1250.45,
  distribution: {
    stocks: 45,
    crypto: 30,
    fiis: 20,
    other: 5,
  },
  dividendsByType: {
    stocks: 420.3,
    fiis: 780.15,
    other: 50.0,
  },
  history: Array.from({length: 30}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().slice(0, 10),
      value: 24000 + Math.random() * 3000,
    };
  }),
  lastDividends: [
    {
      date: '2023-11-15',
      symbol: 'PETR4',
      value: 120.5,
      type: 'stock',
    },
    {
      date: '2023-11-10',
      symbol: 'HGLG11',
      value: 182.75,
      type: 'fii',
    },
    {
      date: '2023-10-28',
      symbol: 'ITSA4',
      value: 87.2,
      type: 'stock',
    },
    {
      date: '2023-10-15',
      symbol: 'XPLG11',
      value: 152.6,
      type: 'fii',
    },
    {
      date: '2023-10-05',
      symbol: 'BBAS3',
      value: 95.7,
      type: 'stock',
    },
  ],
};

const mockAssets: Asset[] = [
  {
    id: '1',
    symbol: 'PETR4',
    name: 'Petrobras',
    price: 30.45,
    change24h: 2.3,
    amount: 100,
    value: 3045.0,
    allocation: 12,
    type: 'stock',
    dividendYield: 12.5,
    lastDividend: 1.25,
  },
  {
    id: '2',
    symbol: 'VALE3',
    name: 'Vale',
    price: 65.7,
    change24h: -1.2,
    amount: 50,
    value: 3285.0,
    allocation: 13,
    type: 'stock',
    dividendYield: 8.7,
    lastDividend: 0.85,
  },
  {
    id: '3',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 225000.0,
    change24h: 4.5,
    amount: 0.025,
    value: 5625.0,
    allocation: 22,
    type: 'crypto',
  },
  {
    id: '4',
    symbol: 'HGLG11',
    name: 'CSHG Logística',
    price: 160.5,
    change24h: 0.8,
    amount: 30,
    value: 4815.0,
    allocation: 19,
    type: 'fii',
    dividendYield: 9.2,
    lastDividend: 1.38,
  },
  {
    id: '5',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 12500.0,
    change24h: -2.1,
    amount: 0.2,
    value: 2500.0,
    allocation: 10,
    type: 'crypto',
  },
];

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
  const {toast} = useToast();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    // Simulating API call with mock data
    setTimeout(() => {
      setSummary(mockSummary);
      setAssets(mockAssets);
      setLoading(false);
    }, 1500);

    // When real API is ready:
    // const fetchDashboardData = async () => {
    //   try {
    //     setLoading(true);
    //     const [summaryRes, assetsRes] = await Promise.all([
    //       portfolioService.getSummary(),
    //       portfolioService.getAssets()
    //     ]);
    //     setSummary(summaryRes.data);
    //     setAssets(assetsRes.data);
    //   } catch (error) {
    //     console.error("Failed to fetch dashboard data", error);
    //     toast({
    //       title: "Erro",
    //       description: "Falha ao carregar dados do dashboard",
    //       variant: "destructive",
    //     });
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchDashboardData();
  }, []);

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

  const dividendsByTypeData = summary
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
      ]
    : [];

  return (
    <div className="container py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

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
                    <span className="ml-2 text-muted-foreground">24h</span>
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
                          labelLine={false}
                          outerRadius={80}
                          dataKey="value"
                          nameKey="name"
                          label={({name, percent}) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }>
                          {dividendsByTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(Number(value)),
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
                              'pt-BR'
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
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/70 transition-colors cursor-pointer">
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
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/70 transition-colors cursor-pointer">
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
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/70 transition-colors cursor-pointer">
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
                      className="flex items-center justify-between p-4 rounded-lg bg-card/50 hover:bg-card/70 transition-colors cursor-pointer">
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
