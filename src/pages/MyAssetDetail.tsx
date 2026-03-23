import {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Wallet,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {useQuery} from '@tanstack/react-query';
import {formatCurrency, formatPercentage} from '@/utils/formatters';
import {portfolioService} from '@/server/api/api';

interface Transaction {
  _id: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  date: string;
  symbol?: string;
}

const MyAssetDetail = () => {
  const {assetId, symbol: symbolParam} = useParams<{assetId?: string; symbol?: string}>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Resolve: use assetId if available, otherwise use symbolParam as fallback key
  const lookupId = assetId;
  const lookupSymbol = symbolParam;

  // Fetch the asset from backend by ID
  const {data: assetById, isLoading: loadingById} = useQuery({
    queryKey: ['assetDetails', lookupId],
    queryFn: async () => {
      if (!lookupId) return null;
      const res = await portfolioService.getAssetDetails(lookupId);
      return res.data;
    },
    enabled: !!lookupId,
  });

  // Fallback: fetch all assets and find by symbol
  const {data: allAssets, isLoading: loadingSymbol} = useQuery({
    queryKey: ['portfolio-assets-for-symbol', lookupSymbol],
    queryFn: async () => {
      if (!lookupSymbol) return null;
      const res = await portfolioService.getAssets();
      return res.data;
    },
    enabled: !lookupId && !!lookupSymbol,
  });

  // Resolve the asset from symbol search (flat assets array)
  const assetBySymbol = (() => {
    if (!allAssets) return null;
    const list = Array.isArray(allAssets) ? allAssets : allAssets?.assets || [];
    return list.find(
      (a: any) => a.symbol?.toUpperCase() === lookupSymbol?.toUpperCase(),
    ) || null;
  })();

  const asset = assetById || assetBySymbol;
  const isLoading = loadingById || loadingSymbol;

  // Fetch transactions for this asset
  const resolvedId = asset?._id || lookupId;
  const {data: transactions = []} = useQuery<Transaction[]>({
    queryKey: ['assetTransactions', resolvedId],
    queryFn: async () => {
      if (!resolvedId) return [];
      const res = await portfolioService.getTransactions({assetId: resolvedId});
      return res.data?.transactions || res.data || [];
    },
    enabled: !!resolvedId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Ativo não encontrado</h1>
        <Button onClick={() => navigate('/portfolio')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Portfólio
        </Button>
      </div>
    );
  }

  const investedValue = (asset.quantity || asset.amount || 0) * (asset.avgPrice || asset.purchasePrice || asset.price || 0);
  const currentValue = (asset.quantity || asset.amount || 0) * (asset.price || 0);
  const profitLoss = currentValue - investedValue;
  const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;
  const isPositive = profitLoss >= 0;

  // Build simple chart data from transactions (oldest to newest)
  const chartData = (() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    let qty = 0;
    let totalInvested = 0;
    return sorted.map((t) => {
      if (t.type === 'buy') {
        qty += t.quantity;
        totalInvested += t.total || t.quantity * t.price;
      } else {
        qty -= t.quantity;
        totalInvested -= t.quantity * t.price;
      }
      const saldo = qty * (asset.price || 0);
      return {
        date: new Date(t.date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        saldo: Math.round(saldo * 100) / 100,
        investido: Math.round(totalInvested * 100) / 100,
        quantidade: qty,
      };
    });
  })();

  const typeLabel =
    asset.type === 'stock'
      ? 'Ação'
      : asset.type === 'fii'
      ? 'FII'
      : asset.type === 'crypto'
      ? 'Cripto'
      : asset.type === 'fund'
      ? 'Renda Fixa'
      : 'Outro';

  const displaySymbol = (() => {
    const rawName = String((asset as any).name || '').trim();
    if (!rawName) return asset.symbol;
    const short = rawName.split('-')[0]?.trim();
    return short || rawName || asset.symbol;
  })();

  const secondaryName = (() => {
    const rawName = String((asset as any).name || '').trim();
    if (!rawName) return '';
    if (rawName === displaySymbol) return '';
    return rawName;
  })();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portfolio')}
            className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Portfólio
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{displaySymbol}</h1>
                <Badge variant="secondary">{typeLabel}</Badge>
              </div>
              {secondaryName ? (
                <p className="text-muted-foreground">{secondaryName}</p>
              ) : (
                <p className="text-muted-foreground">{asset.symbol}</p>
              )}
            </div>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/asset/${asset.symbol}`)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver no Mercado
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  Valor Investido
                </span>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold">
                {formatCurrency(investedValue)}
              </p>
              <p className="text-xs text-muted-foreground">
                PM: {formatCurrency(asset.avgPrice || asset.purchasePrice || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  Saldo Bruto
                </span>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold">{formatCurrency(currentValue)}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(asset.price)} / un
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Quantidade</span>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold">
                {(asset.quantity || asset.amount || 0).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground">unidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  P&L (sem proventos)
                </span>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
              </div>
              <p
                className={`text-xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(profitLoss)}
              </p>
              <p
                className={`text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {formatPercentage(profitLossPercent)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Posição na Carteira</CardTitle>
                  <CardDescription>Métricas pessoais do investidor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {label: 'Preço Médio', value: formatCurrency(asset.avgPrice || asset.purchasePrice || 0)},
                    {label: 'Preço Atual', value: formatCurrency(asset.price || 0)},
                    {label: 'Quantidade', value: `${(asset.quantity || asset.amount || 0).toLocaleString('pt-BR')} un`},
                    {label: 'Valor Investido', value: formatCurrency(investedValue)},
                    {label: 'Saldo Bruto', value: formatCurrency(currentValue)},
                    {label: 'Alocação', value: `${(asset.allocation || 0).toFixed(1)}%`},
                  ].map(({label, value}) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Resultado</CardTitle>
                  <CardDescription>Performance do investimento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">P&L Total (sem proventos)</p>
                    <p
                      className={`text-3xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(profitLoss)}
                    </p>
                    <p
                      className={`text-sm mt-1 flex items-center justify-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {formatPercentage(profitLossPercent)}
                    </p>
                  </div>

                  {(asset.dividendYield) && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Dividend Yield</span>
                      <span className="font-medium text-success">
                        {formatPercentage(asset.dividendYield)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Variação 24h</span>
                    <span
                      className={`font-medium ${(asset.change24h || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatPercentage(asset.change24h || 0)}
                    </span>
                  </div>

                  {asset.targetPrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Target className="h-3.5 w-3.5" />
                        Preço Alvo
                      </span>
                      <span className="font-medium">
                        {formatCurrency(asset.targetPrice)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Movements */}
          <TabsContent value="movements">
            <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Receipt className="h-5 w-5" />
                  Histórico de Movimentações
                </CardTitle>
                <CardDescription>
                  Todas as compras e vendas deste ativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma movimentação registrada</p>
                    <p className="text-xs mt-1">
                      As transações aparecerão aqui conforme forem adicionadas
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((t) => (
                        <TableRow key={t._id}>
                          <TableCell>
                            <Badge
                              variant={
                                t.type === 'buy' ? 'default' : 'destructive'
                              }>
                              {t.type === 'buy' ? 'Compra' : 'Venda'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(t.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            {t.quantity.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(t.price)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${t.type === 'buy' ? 'text-destructive' : 'text-success'}`}>
                            {t.type === 'buy' ? '-' : '+'}
                            {formatCurrency(t.total || t.quantity * t.price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts */}
          <TabsContent value="charts">
            <div className="grid grid-cols-1 gap-6">
              <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Saldo Bruto vs Valor Investido</CardTitle>
                  <CardDescription>Evolução ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length < 2 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mx-auto mb-3 opacity-30" />
                      <p>Dados insuficientes para gerar o gráfico</p>
                      <p className="text-xs mt-1">
                        Adicione transações para visualizar a evolução
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" tick={{fontSize: 11}} />
                        <YAxis
                          tick={{fontSize: 11}}
                          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(v, name) => [
                            formatCurrency(Number(v)),
                            name === 'saldo' ? 'Saldo Bruto' : 'Valor Investido',
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="saldo"
                          stroke="#22c55e"
                          strokeWidth={2}
                          fill="url(#saldoGrad)"
                          name="saldo"
                        />
                        <Area
                          type="monotone"
                          dataKey="investido"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#investGrad)"
                          name="investido"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Evolução da Quantidade</CardTitle>
                  <CardDescription>
                    Quantidade de ativos ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length < 2 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Dados insuficientes</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="date" tick={{fontSize: 11}} />
                        <YAxis tick={{fontSize: 11}} />
                        <Tooltip
                          formatter={(v) => [
                            `${Number(v).toLocaleString('pt-BR')} un`,
                            'Quantidade',
                          ]}
                        />
                        <Line
                          type="stepAfter"
                          dataKey="quantidade"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={false}
                          name="quantidade"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyAssetDetail;
