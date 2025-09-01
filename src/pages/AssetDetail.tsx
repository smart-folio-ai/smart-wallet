import {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calculator,
  Building2,
  DollarSign,
  BarChart3,
  Star,
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {Asset} from '@/types/portfolio';
import {mockAssets} from '@/utils/mockData';
import {formatCurrency, formatPercentage} from '@/utils/formatters';
import {CustomTooltip} from '@/components/ui/custom-tooltip';
import {PremiumBlur} from '@/components/ui/premium-blur';

interface AssetIndicators {
  valuation: {
    pe: number;
    pb: number;
    pvp: number;
    ev_ebitda: number;
    price_sales: number;
  };
  debt: {
    debt_equity: number;
    current_ratio: number;
    quick_ratio: number;
    debt_ebitda: number;
  };
  efficiency: {
    roe: number;
    roa: number;
    roic: number;
    gross_margin: number;
    net_margin: number;
  };
  profitability: {
    revenue_growth: number;
    earnings_growth: number;
    dividend_growth: number;
    book_value_growth: number;
  };
}

interface FinancialData {
  revenue: number;
  net_income: number;
  total_assets: number;
  total_debt: number;
  shareholders_equity: number;
  operating_cash_flow: number;
}

interface CompanyInfo {
  description: string;
  sector: string;
  industry: string;
  employees: number;
  headquarters: string;
  founded: string;
  website: string;
}

// Mock data para demonstração
const mockIndicators: AssetIndicators = {
  valuation: {
    pe: 12.5,
    pb: 1.8,
    pvp: 0.9,
    ev_ebitda: 8.2,
    price_sales: 2.1,
  },
  debt: {
    debt_equity: 0.45,
    current_ratio: 1.8,
    quick_ratio: 1.2,
    debt_ebitda: 2.1,
  },
  efficiency: {
    roe: 15.2,
    roa: 8.5,
    roic: 12.8,
    gross_margin: 35.6,
    net_margin: 12.4,
  },
  profitability: {
    revenue_growth: 8.5,
    earnings_growth: 12.3,
    dividend_growth: 6.8,
    book_value_growth: 9.2,
  },
};

const mockFinancialData: FinancialData = {
  revenue: 45600000000,
  net_income: 5650000000,
  total_assets: 125000000000,
  total_debt: 32000000000,
  shareholders_equity: 68000000000,
  operating_cash_flow: 8900000000,
};

const mockCompanyInfo: CompanyInfo = {
  description:
    'Empresa líder no setor de tecnologia e serviços financeiros, com foco em inovação e sustentabilidade.',
  sector: 'Tecnologia',
  industry: 'Software e Serviços',
  employees: 45000,
  headquarters: 'São Paulo, SP',
  founded: '1990',
  website: 'www.empresa.com.br',
};

export default function AssetDetail() {
  const {symbol} = useParams<{symbol: string}>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (symbol) {
      const foundAsset = mockAssets.find((a) => a.symbol === symbol);
      setAsset(foundAsset || null);
      setLoading(false);
    }
  }, [symbol]);

  const calculateGrahamValue = () => {
    if (!asset) return 0;
    // Fórmula simplificada de Graham: √(22.5 × EPS × Book Value per Share)
    const eps = 5.45; // Mock EPS
    const bvps = 28.3; // Mock Book Value per Share
    return Math.sqrt(22.5 * eps * bvps);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Ativo não encontrado</h1>
        <Button onClick={() => navigate('/portfolio')}>
          Voltar ao Portfolio
        </Button>
      </div>
    );
  }

  const grahamValue = calculateGrahamValue();
  const isUndervalued = asset.price < grahamValue;

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
            Voltar
          </Button>
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{asset.symbol}</h1>
              <p className="text-muted-foreground">{asset.name}</p>
            </div>
            <Badge
              variant={
                asset.type === 'stock'
                  ? 'default'
                  : asset.type === 'crypto'
                  ? 'secondary'
                  : 'outline'
              }>
              {asset.type.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Informações básicas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Preço Atual</span>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(asset.price)}
              </p>
              <p
                className={`text-sm flex items-center gap-1 ${
                  asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                {asset.change24h >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatPercentage(asset.change24h)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quantidade</span>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{asset.amount}</p>
              <p className="text-sm text-muted-foreground">unidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Valor Total</span>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(asset.value)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatPercentage(asset.allocation)} da carteira
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">P&L</span>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </div>
              <p
                className={`text-2xl font-bold ${
                  (asset.profitLoss || 0) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                {formatCurrency(asset.profitLoss || 0)}
              </p>
              <p
                className={`text-sm ${
                  (asset.profitLossPercentage || 0) >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                {formatPercentage(asset.profitLossPercentage || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principais */}
        <Tabs defaultValue="indicators" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="indicators">Indicadores</TabsTrigger>
            <TabsTrigger value="fair-price">Preço Justo</TabsTrigger>
            <TabsTrigger value="financial">Contábil</TabsTrigger>
            <TabsTrigger value="dividends">Dividendos</TabsTrigger>
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="ai-insights">IA Insights</TabsTrigger>
          </TabsList>

          {/* Indicadores */}
          <TabsContent value="indicators">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Valuation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Valuation</CardTitle>
                  <CardDescription>Múltiplos de avaliação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>P/L</span>
                    <span className="font-medium">
                      {mockIndicators.valuation.pe}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>P/VP</span>
                    <span className="font-medium">
                      {mockIndicators.valuation.pb}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>EV/EBITDA</span>
                    <span className="font-medium">
                      {mockIndicators.valuation.ev_ebitda}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>P/Receita</span>
                    <span className="font-medium">
                      {mockIndicators.valuation.price_sales}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Endividamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Endividamento</CardTitle>
                  <CardDescription>Indicadores de solvência</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Dívida/Patrimônio</span>
                    <span className="font-medium">
                      {mockIndicators.debt.debt_equity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Liquidez Corrente</span>
                    <span className="font-medium">
                      {mockIndicators.debt.current_ratio}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Liquidez Seca</span>
                    <span className="font-medium">
                      {mockIndicators.debt.quick_ratio}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dívida/EBITDA</span>
                    <span className="font-medium">
                      {mockIndicators.debt.debt_ebitda}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Eficiência */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Eficiência</CardTitle>
                  <CardDescription>Retornos e margens</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>ROE</span>
                    <span className="font-medium">
                      {formatPercentage(mockIndicators.efficiency.roe)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ROA</span>
                    <span className="font-medium">
                      {formatPercentage(mockIndicators.efficiency.roa)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ROIC</span>
                    <span className="font-medium">
                      {formatPercentage(mockIndicators.efficiency.roic)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margem Líquida</span>
                    <span className="font-medium">
                      {formatPercentage(mockIndicators.efficiency.net_margin)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Rentabilidade e Crescimento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Crescimento</CardTitle>
                  <CardDescription>Crescimento ano a ano</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Receita</span>
                    <span className="font-medium text-green-500">
                      {formatPercentage(
                        mockIndicators.profitability.revenue_growth
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lucro</span>
                    <span className="font-medium text-green-500">
                      {formatPercentage(
                        mockIndicators.profitability.earnings_growth
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dividendos</span>
                    <span className="font-medium text-green-500">
                      {formatPercentage(
                        mockIndicators.profitability.dividend_growth
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patrimônio</span>
                    <span className="font-medium text-green-500">
                      {formatPercentage(
                        mockIndicators.profitability.book_value_growth
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preço Justo */}
          <TabsContent value="fair-price">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fórmula de Graham</CardTitle>
                  <CardDescription>
                    Valor intrínseco baseado na metodologia de Benjamin Graham
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Preço Justo (Graham)
                      </p>
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(grahamValue)}
                      </p>
                      <p className="text-sm mt-2">
                        Preço atual: {formatCurrency(asset.price)}
                        <Badge
                          variant={isUndervalued ? 'default' : 'destructive'}
                          className="ml-2">
                          {isUndervalued ? 'Subvalorizada' : 'Sobrevalorizada'}
                        </Badge>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Cálculo:</h4>
                      <p className="text-sm text-muted-foreground">
                        √(22.5 × LPA × VPA) = √(22.5 × 5.45 × 28.30) ={' '}
                        {formatCurrency(grahamValue)}
                      </p>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <span className="text-sm font-medium">
                            LPA (Lucro por Ação)
                          </span>
                          <p className="text-lg">{formatCurrency(5.45)}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">
                            VPA (Valor Patrimonial)
                          </span>
                          <p className="text-lg">{formatCurrency(28.3)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise da IA</CardTitle>
                  <CardDescription>
                    Recomendação baseada em inteligência artificial
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge
                        variant={
                          asset.aiRecommendation === 'buy'
                            ? 'default'
                            : asset.aiRecommendation === 'hold'
                            ? 'secondary'
                            : 'destructive'
                        }>
                        {asset.aiRecommendation?.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Confiança: {formatPercentage(asset.aiConfidence || 0)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">Análise Detalhada:</h4>
                      <p className="text-sm">
                        Com base nos fundamentos atuais, a empresa apresenta
                        indicadores sólidos de crescimento e rentabilidade. O
                        P/L de {mockIndicators.valuation.pe} está abaixo da
                        média do setor, indicando uma possível oportunidade.
                      </p>
                      <p className="text-sm">
                        A margem líquida de{' '}
                        {formatPercentage(mockIndicators.efficiency.net_margin)}{' '}
                        e ROE de{' '}
                        {formatPercentage(mockIndicators.efficiency.roe)}
                        demonstram eficiência operacional consistente.
                      </p>
                      <p className="text-sm">
                        Considerando o crescimento de receita de{' '}
                        {formatPercentage(
                          mockIndicators.profitability.revenue_growth
                        )}
                        e a posição financeira sólida, a recomendação é de{' '}
                        {asset.aiRecommendation?.toUpperCase()}.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dados Contábeis */}
          <TabsContent value="financial">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Demonstrações Financeiras
                  </CardTitle>
                  <CardDescription>
                    Principais números do último período
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Receita Líquida</span>
                    <span className="font-medium">
                      {formatCurrency(mockFinancialData.revenue / 1000000)} Mi
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lucro Líquido</span>
                    <span className="font-medium">
                      {formatCurrency(mockFinancialData.net_income / 1000000)}{' '}
                      Mi
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Ativos</span>
                    <span className="font-medium">
                      {formatCurrency(mockFinancialData.total_assets / 1000000)}{' '}
                      Mi
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Dívidas</span>
                    <span className="font-medium">
                      {formatCurrency(mockFinancialData.total_debt / 1000000)}{' '}
                      Mi
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Patrimônio Líquido</span>
                    <span className="font-medium">
                      {formatCurrency(
                        mockFinancialData.shareholders_equity / 1000000
                      )}{' '}
                      Mi
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fluxo de Caixa Operacional</span>
                    <span className="font-medium">
                      {formatCurrency(
                        mockFinancialData.operating_cash_flow / 1000000
                      )}{' '}
                      Mi
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evolução Financeira</CardTitle>
                  <CardDescription>Últimos 5 anos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {year: '2019', receita: 38.2, lucro: 4.1},
                        {year: '2020', receita: 41.5, lucro: 4.8},
                        {year: '2021', receita: 43.8, lucro: 5.2},
                        {year: '2022', receita: 44.1, lucro: 5.4},
                        {year: '2023', receita: 45.6, lucro: 5.7},
                      ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="receita"
                        fill="hsl(var(--primary))"
                        name="Receita (Bi)"
                      />
                      <Bar
                        dataKey="lucro"
                        fill="hsl(var(--secondary))"
                        name="Lucro (Bi)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dividendos */}
          <TabsContent value="dividends">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Histórico de Dividendos
                  </CardTitle>
                  <CardDescription>
                    Distribuições dos últimos 12 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {asset.dividendHistory?.map((dividend, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm">{dividend.date}</span>
                        <span className="font-medium">
                          {formatCurrency(dividend.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Yield e Projeções</CardTitle>
                  <CardDescription>Análise de rendimento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Dividend Yield
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPercentage(asset.dividendYield || 0)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Último Dividendo</span>
                      <span className="font-medium">
                        {formatCurrency(asset.lastDividend || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payout Ratio</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crescimento (5a)</span>
                      <span className="font-medium text-green-500">+8.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frequência</span>
                      <span className="font-medium">Semestral</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sobre a Empresa */}
          <TabsContent value="company">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sobre a Empresa</CardTitle>
                    <CardDescription>Informações corporativas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">
                      {mockCompanyInfo.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium">Setor</span>
                        <p className="text-sm text-muted-foreground">
                          {mockCompanyInfo.sector}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Indústria</span>
                        <p className="text-sm text-muted-foreground">
                          {mockCompanyInfo.industry}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">
                          Funcionários
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {mockCompanyInfo.employees.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Fundada em</span>
                        <p className="text-sm text-muted-foreground">
                          {mockCompanyInfo.founded}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Sede</span>
                        <p className="text-sm text-muted-foreground">
                          {mockCompanyInfo.headquarters}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Website</span>
                        <p className="text-sm text-muted-foreground">
                          {mockCompanyInfo.website}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dados de Mercado</CardTitle>
                  <CardDescription>Informações adicionais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Market Cap</span>
                    <p className="text-sm text-muted-foreground">R$ 125,4 Bi</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Volume Médio</span>
                    <p className="text-sm text-muted-foreground">R$ 45,2 Mi</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Free Float</span>
                    <p className="text-sm text-muted-foreground">68%</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      Ações em Circulação
                    </span>
                    <p className="text-sm text-muted-foreground">2,4 Bi</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Máxima 52s</span>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(asset.price * 1.15)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Mínima 52s</span>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(asset.price * 0.82)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Nova aba IA Insights */}
          <TabsContent value="ai-insights">
            <PremiumBlur
              title="IA Insights Premium"
              description="Análises avançadas geradas por inteligência artificial"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Análise de Sentimento
                    </CardTitle>
                    <CardDescription>
                      Análise de notícias e redes sociais sobre {asset?.symbol}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-green-500/10 rounded-lg">
                        <p className="text-2xl font-bold text-green-500 mb-2">85%</p>
                        <p className="text-sm text-muted-foreground">Sentimento Positivo</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Notícias Positivas</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full">
                              <div className="w-4/5 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <span className="text-sm font-medium">80%</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Redes Sociais</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full">
                              <div className="w-full h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <span className="text-sm font-medium">90%</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Analistas</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full">
                              <div className="w-3/4 h-2 bg-yellow-500 rounded-full"></div>
                            </div>
                            <span className="text-sm font-medium">75%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recomendação da IA</CardTitle>
                    <CardDescription>
                      Baseada em mais de 50 indicadores técnicos e fundamentalistas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-primary/10 rounded-lg">
                        <Badge variant="default" className="text-lg px-4 py-2 mb-2">
                          COMPRAR
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Confiança: 92%
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold">Principais Fatores:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Fundamentos sólidos com P/L atrativo
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Crescimento consistente de receita
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Dividend yield acima da média do setor
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            Volatilidade moderada do setor
                          </li>
                        </ul>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Preço Alvo (12 meses):</h4>
                        <p className="text-2xl font-bold text-primary">
                          {asset && formatCurrency(asset.price * 1.25)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Potencial de alta: +25%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Comparação com Setor</CardTitle>
                    <CardDescription>
                      Como {asset?.symbol} se compara com empresas similares
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <h4 className="font-semibold mb-2">P/L</h4>
                        <div className="relative">
                          <div className="text-2xl font-bold">{mockIndicators.valuation.pe}</div>
                          <div className="text-sm text-green-500">vs 15.2 (setor)</div>
                          <Badge variant="default" className="mt-2">Melhor que setor</Badge>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <h4 className="font-semibold mb-2">ROE</h4>
                        <div className="relative">
                          <div className="text-2xl font-bold">{formatPercentage(mockIndicators.efficiency.roe)}</div>
                          <div className="text-sm text-green-500">vs 12.8% (setor)</div>
                          <Badge variant="default" className="mt-2">Acima da média</Badge>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <h4 className="font-semibold mb-2">Dividend Yield</h4>
                        <div className="relative">
                          <div className="text-2xl font-bold">{formatPercentage(asset?.dividendYield || 0)}</div>
                          <div className="text-sm text-green-500">vs 4.2% (setor)</div>
                          <Badge variant="default" className="mt-2">Superior</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </PremiumBlur>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
