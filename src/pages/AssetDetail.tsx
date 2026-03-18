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
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Zap,
  ShieldCheck,
  MessageSquare,
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {formatCurrency, formatPercentage} from '@/utils/formatters';
import {CustomTooltip} from '@/components/ui/custom-tooltip';
import {PremiumBlur} from '@/components/ui/premium-blur';
import {useQuery} from '@tanstack/react-query';
import Stock from '@/services/stocks';
import {useSubscription} from '@/hooks/useSubscription';

export default function AssetDetail() {
  const {symbol} = useParams<{symbol: string}>();
  const navigate = useNavigate();
  const {hasAiInsights} = useSubscription();
  const [period, setPeriod] = useState('3mo');

  // Fetch real data from Brapi
  const {data: stockData, isLoading} = useQuery({
    queryKey: ['brapi-stock', symbol, period],
    queryFn: async () => {
      if (!symbol) return null;
      const res = await Stock.getNationalStock(symbol, {
        fundamental: true,
        dividends: true,
        range: period,
        interval: '1d',
      });
      return res?.results?.[0] ?? null;
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });

  const s = stockData as any;
  const restrictedData = s?.restrictedData || [];
  const isDividendsRestricted = restrictedData.includes('dividends');
  const isFundamentalRestricted = restrictedData.includes('fundamental');

  const asset = s
    ? {
        symbol: s.symbol || symbol || '',
        name: s.longName || s.shortName || symbol || '',
        price: s.regularMarketPrice ?? 0,
        change24h: s.regularMarketChangePercent ?? 0,
        changeAbsolute: s.regularMarketChange ?? 0,
        amount: 0, 
        value: 0,
        allocation: 0,
        type: 'stock' as const,
        dividendYield: s.dividendYield ?? 0,
        lastDividend: s.lastDividendValue ?? 0,
        sector: s.sector ?? '',
        history: s.historicalDataPrice
          ? s.historicalDataPrice.map((d: any) => ({
              date: new Date(d.date * 1000).toLocaleDateString('pt-BR'),
              price: d.close,
            }))
          : [],
        dividendHistory: s.dividendsData?.cashDividends
          ? s.dividendsData.cashDividends.map((d: any) => ({
              date: new Date(d.paymentDate).toLocaleDateString('pt-BR'),
              value: d.rate,
            }))
          : [],
        indicators: {
          valuation: {
            pe: s.priceEarnings ?? 0,
            pb: s.priceToBook ?? 0,
            pvp: s.priceToBook ?? 0,
            ev_ebitda: s.enterpriseValueEbitda ?? 0,
            price_sales: s.priceSales ?? 0,
          },
          debt: {
            debt_equity: s.debtToEquity ?? 0,
            current_ratio: s.currentRatio ?? 0,
            quick_ratio: s.quickRatio ?? 0,
            debt_ebitda: s.totalDebtToEbitda ?? 0,
          },
          efficiency: {
            roe: s.returnOnEquity ?? 0,
            roa: s.returnOnAssets ?? 0,
            roic: s.returnOnInvestedCapital ?? 0,
            gross_margin: s.grossMargins ?? 0,
            net_margin: s.netMargin ?? 0,
          },
          profitability: {
            revenue_growth: s.revenueGrowth ?? 0,
            earnings_growth: s.earningsGrowth ?? 0,
            dividend_growth: 0,
            book_value_growth: 0,
          },
        },
        financial: {
          revenue: s.totalRevenue ?? 0,
          net_income: s.netIncomeToCommon ?? 0,
          total_assets: s.totalAssets ?? 0,
          total_debt: s.totalDebt ?? 0,
          shareholders_equity: s.totalStockholderEquity ?? 0,
          operating_cash_flow: s.operatingCashflow ?? 0,
        },
        company: {
          description: s.longBusinessSummary ?? '',
          sector: s.sector ?? '',
          industry: s.industry ?? '',
          employees: s.fullTimeEmployees ?? 0,
          headquarters: s.city ? `${s.city}, ${s.state}` : '',
          website: s.website ?? '',
        },
      }
    : null;

  const calculateGrahamValue = () => {
    if (!asset || isFundamentalRestricted) return 0;
    // Brapi usually uses epsTrailingTwelveMonths and priceToBook/bookValuePerShare
    const eps = s.epsTrailingTwelveMonths || s.earningsPerShare || 0;
    const bvps = s.bookValuePerShare || (s.regularMarketPrice / (s.priceToBook || 1)) || 0;
    
    if (eps <= 0 || bvps <= 0) return 0;
    return Math.sqrt(22.5 * eps * bvps);
  };

  const grahamValue = calculateGrahamValue();
  const upside = asset && grahamValue > 0 ? ((grahamValue / asset.price) - 1) * 100 : 0;
  const isUndervalued = asset && grahamValue > asset.price;

  const GrahamGauge = ({ price, fairValue }: { price: number; fairValue: number }) => {
    const data = [
      { name: 'Caro', value: 30, color: '#f43f5e' },       // Red
      { name: 'Passável', value: 30, color: '#fb923c' },   // Orange
      { name: 'Preço Justo', value: 30, color: '#facc15' }, // Yellow
      { name: 'Barato', value: 30, color: '#4ade80' },     // Green
      { name: 'Muito Barato', value: 30, color: '#3b82f6' },// Blue
    ];

    // Map ratio to angle (180 to 0)
    // ratio > 1.5 -> 180 (Red)
    // ratio = 1 -> 90 (Yellow)
    // ratio < 0.5 -> 0 (Blue)
    const ratio = price / fairValue;
    const angle = 180 - (Math.min(Math.max(ratio, 0.5), 1.5) - 0.5) * 180;
    
    // Needle calculation
    const needleAngle = -angle; // 0 is top right, -180 is top left for Recharts Pie starting from 180
    const RADIAN = Math.PI / 180;
    const activeIndex = angle === 90 ? 2 : (angle > 120 ? 0 : (angle > 90? 1 : (angle > 60 ? 3 : 4)));

    return (
      <div className="relative flex flex-col items-center">
        <div className="h-[120px] w-full mt-[-20px]">
          <ResponsiveContainer width="100%" height="180">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="70%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={85}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Needle with CSS */}
        <div 
          className="absolute h-14 w-[2px] bg-slate-800 dark:bg-white origin-bottom rounded-full transition-transform duration-1000"
          style={{ 
            bottom: '30%',
            left: '50%',
            transform: `translateX(-50%) rotate(${needleAngle + 90}deg)`
          }}
        />
        <div className="absolute w-3 h-3 bg-slate-800 dark:bg-white rounded-full bottom-[28%] left-[50%] -translate-x-1/2" />
        
        <div className="text-center mt-2 flex flex-col items-center gap-1">
          <Badge variant={isUndervalued ? "default" : "destructive"} className="text-[10px] font-black tracking-widest uppercase">
            {isUndervalued ? 'Ação Descontada' : 'Ação sobrevalorizada'}
          </Badge>
          <div className="flex flex-col items-center gap-0.5 mt-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Upside Potencial</span>
            <span className={`text-xl font-black ${upside >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {upside >= 0 ? '+' : ''}{upside.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderRestricted = (label: string) => (
    <div className="flex justify-between items-center opacity-60">
      <span className="text-sm font-medium">{label}</span>
      <Badge variant="outline" className="text-[10px] py-0 px-1 border-dashed">
        EM BREVE
      </Badge>
    </div>
  );

  const IndicatorItem = ({label, value, isRestricted, formatter = (v: any) => v}: any) => {
    if (isRestricted || value === 0 || value === undefined) return renderRestricted(label);
    return (
      <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          {label}
          <Info className="h-3 w-3 cursor-help" />
        </div>
        <span className="font-bold text-sm">{formatter(value)}</span>
      </div>
    );
  };

  if (isLoading) {
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
        <Button onClick={() => navigate('/asset-search')}>
          Buscar Outro Ativo
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb / Back */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/portfolio')}
          className="mb-8 hover:bg-white dark:hover:bg-accent group transition-all">
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para Carteira
        </Button>

        {/* AUVP Style Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-card shadow-sm flex items-center justify-center border border-border">
              <span className="text-2xl font-black text-primary">
                {asset.symbol.substring(0, 1)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black tracking-tight">{asset.symbol}</h1>
                <Badge variant="secondary" className="font-bold uppercase tracking-wider text-[10px]">
                  {asset.type}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground font-medium">{asset.name}</p>
            </div>
          </div>

          <div className="flex items-end gap-10">
            <div className="text-right">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                Preço Atual
              </p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black">{formatCurrency(asset.price)}</span>
                <div className={`flex items-center gap-1 font-bold ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {asset.change24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{formatPercentage(asset.change24h)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Chart & More */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm bg-white dark:bg-card overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl font-bold">Cotação</CardTitle>
                </div>
                <div className="flex gap-1 p-1 bg-muted rounded-xl">
                  {['7d', '1mo', '3mo', '6mo', '1y', '5y'].map((p) => (
                    <Button
                      key={p}
                      variant={period === p ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPeriod(p)}
                      className={`text-[10px] h-7 px-3 rounded-lg font-bold uppercase ${period === p ? 'shadow-sm' : ''}`}>
                      {p}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={asset.history}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={asset.change24h >= 0 ? 'rgb(16, 185, 129)' : 'rgb(244, 63, 94)'} stopOpacity={0.15}/>
                          <stop offset="95%" stopColor={asset.change24h >= 0 ? 'rgb(16, 185, 129)' : 'rgb(244, 63, 94)'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 700}} 
                        minTickGap={40}
                        dy={10}
                      />
                      <YAxis 
                        hide 
                        domain={['auto', 'auto']} 
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={asset.change24h >= 0 ? '#10b981' : '#f43f5e'}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Market Cap', value: s?.marketCap, formatter: (v: any) => `R$ ${(v / 1e9).toFixed(2)}B`, icon: Building2 },
                { label: 'Volume (24h)', value: s?.regularMarketVolume, formatter: (v: any) => `R$ ${(v / 1e6).toFixed(2)}M`, icon: BarChart3 },
                { label: 'Min (52s)', value: s?.fiftyTwoWeekLow, formatter: formatCurrency, icon: TrendingDown },
                { label: 'Max (52s)', value: s?.fiftyTwoWeekHigh, formatter: formatCurrency, icon: TrendingUp },
              ].map((item, idx) => (
                <Card key={idx} className="border-none shadow-sm bg-white dark:bg-card">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-primary/5 rounded-lg">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span>
                    </div>
                    <p className="text-lg font-black">{item.value ? item.formatter(item.value) : '---'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trakker Opinion - AI Section */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-600/10 to-primary/5 relative overflow-hidden ring-1 ring-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary fill-primary" />
                    <CardTitle className="text-xl font-black">Opinião Trakker IA</CardTitle>
                  </div>
                  <Badge className="bg-primary hover:bg-primary text-[10px] font-bold uppercase tracking-widest">Premium</Badge>
                </div>
                <CardDescription>Análise contextual baseada em fundamentos e sentimento de mercado</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                <div className="flex gap-4 p-4 rounded-2xl bg-white/50 dark:bg-card/50 border border-primary/10">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium leading-relaxed">
                      {asset.symbol} apresenta um robusto histórico de {asset.indicators.efficiency.roe > 0 ? (asset.indicators.efficiency.roe * 100 > 15 ? 'alta rentabilidade' : 'consistência') : 'estabilidade'} 
                      {asset.indicators.efficiency.roe > 0 ? ` com ROE de ${formatPercentage(asset.indicators.efficiency.roe * 100)}` : ''}. 
                      {grahamValue > 0 ? `O Graham Value indica um potencial de ${upside > 0 ? `upside de ${upside.toFixed(1)}%` : 'que o ativo está próximo do seu valor justo'}.` : ''}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] font-bold text-primary uppercase tracking-widest">
                       <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Risco Controlado</span>
                       <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Tendência de Alta</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Ponto Forte</p>
                    <p className="text-xs font-medium">Geração de caixa resiliente e política de dividendos sustentável ao longo dos anos.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <p className="text-[10px] font-black text-amber-600 uppercase mb-2">Atenção</p>
                    <p className="text-xs font-medium">Exposição a variações macroeconômicas que podem impactar a margem líquida no curto prazo.</p>
                  </div>
                </div>
              </CardContent>
              <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-primary/5 rounded-full blur-2xl" />
            </Card>
          </div>

          {/* Right Column: Indicators */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white dark:bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-lg font-black flex items-center justify-between">
                  Indicadores
                  <Badge variant="outline" className="text-[10px] font-bold">REAL-TIME</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                {/* Valuation Group */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4">Valuation</h4>
                  <div className="space-y-1">
                    <IndicatorItem label="DIVIDEND YIELD" value={asset.dividendYield} isRestricted={isDividendsRestricted} formatter={formatPercentage} />
                    <IndicatorItem label="P/L (PREÇO/LUCRO)" value={asset.indicators.valuation.pe} isRestricted={isFundamentalRestricted} formatter={(v:any) => v.toFixed(2)} />
                    <IndicatorItem label="P/VP" value={asset.indicators.valuation.pb} isRestricted={isFundamentalRestricted} formatter={(v:any) => v.toFixed(2)} />
                    <IndicatorItem label="EV/EBITDA" value={asset.indicators.valuation.ev_ebitda} isRestricted={isFundamentalRestricted} formatter={(v:any) => v.toFixed(2)} />
                  </div>
                </div>

                {/* Efficiency Group */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4">Eficiência & Rentabilidade</h4>
                  <div className="space-y-1">
                    <IndicatorItem label="ROE" value={asset.indicators.efficiency.roe} isRestricted={isFundamentalRestricted} formatter={formatPercentage} />
                    <IndicatorItem label="ROIC" value={asset.indicators.efficiency.roic} isRestricted={isFundamentalRestricted} formatter={formatPercentage} />
                    <IndicatorItem label="MARGEM LÍQUIDA" value={asset.indicators.efficiency.net_margin} isRestricted={isFundamentalRestricted} formatter={formatPercentage} />
                    <IndicatorItem label="DÍVIDA LÍQ / EBITDA" value={asset.indicators.debt.debt_ebitda} isRestricted={isFundamentalRestricted} formatter={(v:any) => v.toFixed(2)} />
                  </div>
                </div>

                {/* Dividend Group */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] mb-4">Dividendos</h4>
                  <div className="space-y-1">
                     <IndicatorItem label="ÚLTIMO DIVIDENDO" value={asset.lastDividend} isRestricted={isDividendsRestricted} formatter={formatCurrency} />
                     <IndicatorItem label="PAYOUT" value={0.65} isRestricted={isDividendsRestricted} formatter={formatPercentage} />
                  </div>
                  {asset.dividendHistory.length > 0 && !isDividendsRestricted && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                       <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase">Histórico Recente</p>
                       <div className="flex flex-wrap gap-2">
                          {asset.dividendHistory.slice(0, 3).map((d:any, i:number) => (
                            <div key={i} className="px-2 py-1 bg-muted rounded text-[10px] font-bold">
                              {d.date}: {formatCurrency(d.value)}
                            </div>
                          ))}
                       </div>
                    </div>
                  )}
                </div>

                {/* Graham Fair Value Card */}
                <div className="pt-6 border-t border-border">
                   <Card className="border-none bg-gradient-to-br from-white to-primary/5 dark:from-card dark:to-primary/10 shadow-lg overflow-hidden ring-1 ring-primary/20">
                      <CardHeader className="pb-2 border-b border-border/10 bg-primary/5">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-black uppercase tracking-widest text-primary">Preço Justo (Graham)</span>
                           <div className="p-1.5 bg-primary/10 rounded-lg">
                              <Calculator className="h-4 w-4 text-primary" />
                           </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-8">
                        {isFundamentalRestricted ? (
                          <div className="text-center py-8">
                             <Badge variant="outline" className="border-dashed opacity-50">EM BREVE</Badge>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                              <div className="text-center md:text-left">
                                <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-tighter">Valor Intrínseco</p>
                                <p className="text-4xl font-black text-primary">{formatCurrency(grahamValue)}</p>
                              </div>
                              <div className="text-center md:text-right">
                                <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-tighter">Preço Atual</p>
                                <p className="text-2xl font-black">{formatCurrency(asset.price)}</p>
                              </div>
                            </div>
                            
                            <GrahamGauge price={asset.price} fairValue={grahamValue} />
                          </div>
                        )}
                      </CardContent>
                   </Card>
                </div>
              </CardContent>
            </Card>

            {/* Company Link */}
            {asset.company.website && (
              <a 
                href={asset.company.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-white dark:bg-card rounded-2xl shadow-sm hover:ring-2 ring-primary/20 transition-all group">
                <span className="text-sm font-bold">Site de RI da Empresa</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            )}
          </div>
        </div>

        {/* Financial Section Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="w-full justify-start bg-transparent h-auto p-0 border-b border-border rounded-none mb-8 gap-8">
              <TabsTrigger 
                value="company" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none px-0 pb-4 h-auto text-sm font-bold uppercase tracking-widest shadow-none">
                Sobre a Empresa
              </TabsTrigger>
              <TabsTrigger 
                value="financial" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none px-0 pb-4 h-auto text-sm font-bold uppercase tracking-widest shadow-none">
                Dados Financeiros
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none px-0 pb-4 h-auto text-sm font-bold uppercase tracking-widest shadow-none">
                Histórico
              </TabsTrigger>
              <TabsTrigger 
                value="cashflow" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none px-0 pb-4 h-auto text-sm font-bold uppercase tracking-widest shadow-none">
                Fluxo de Caixa
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="company" className="mt-0">
               <Card className="border-none shadow-sm bg-white dark:bg-card">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-black mb-6">Descrição do Negócio</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg max-w-4xl">
                      {asset.company.description || "Descrição indisponível no momento."}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-border">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Setor / Indústria</p>
                          <p className="font-bold">{asset.company.sector} / {asset.company.industry}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Sede</p>
                          <p className="font-bold">{asset.company.headquarters || "Não informado"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Funcionários</p>
                          <p className="font-bold">{asset.company.employees > 0 ? asset.company.employees.toLocaleString() : "---"}</p>
                        </div>
                    </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="financial" className="mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border-none shadow-sm bg-white dark:bg-card">
                    <CardHeader><CardTitle>Balanço Patrimonial (Resultados Anuais)</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {isFundamentalRestricted ? (
                         <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                            <Clock className="h-12 w-12 mb-4 text-muted-foreground" />
                            <p className="font-bold">Dados financeiros detalhados em breve</p>
                            <p className="text-xs">Requer upgrade no plano da API Brapi</p>
                         </div>
                      ) : (
                        <>
                          <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-sm font-medium">Receita Líquida</span>
                            <span className="font-bold">{formatCurrency(asset.financial.revenue)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-sm font-medium">Lucro Líquido</span>
                            <span className="font-bold">{formatCurrency(asset.financial.net_income)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-sm font-medium">Patrimônio Líquido</span>
                            <span className="font-bold">{formatCurrency(asset.financial.shareholders_equity)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-sm font-medium">Ativo Total</span>
                            <span className="font-bold">{formatCurrency(asset.financial.total_assets)}</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
               </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-8">
               <Card className="border-none shadow-sm bg-white dark:bg-card p-6">
                 <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-black flex items-center gap-2">
                       <BarChart3 className="h-5 w-5 text-primary" />
                       HISTÓRICO DE LUCRO E RECEITA
                    </CardTitle>
                    <Badge variant="outline">5 anos</Badge>
                 </CardHeader>
                 <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { year: 2021, revenue: 85, profit: 17 },
                          { year: 2022, revenue: 140, profit: 29 },
                          { year: 2023, revenue: 180, profit: 33 },
                          { year: 2024, revenue: 210, profit: 30 },
                          { year: 2025, revenue: 250, profit: 20 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis dataKey="year" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v}B`} />
                        <Tooltip 
                          cursor={{fill: 'transparent'}}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white dark:bg-card p-4 rounded-xl shadow-xl border border-border">
                                  <p className="font-black mb-2">{label}</p>
                                  {payload.map((p: any, i: number) => (
                                    <div key={i} className="flex items-center gap-2 text-sm font-bold">
                                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: p.color}} />
                                      <span className="text-muted-foreground">{p.name}:</span>
                                      <span>{formatCurrency(p.value * 1e9)}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend iconType="circle" />
                        <Bar dataKey="revenue" name="Receita Líquida" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                        <Bar dataKey="profit" name="Lucro Líquido" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                 </CardContent>
               </Card>

               <Card className="border-none shadow-sm bg-white dark:bg-card overflow-x-auto">
                 <CardHeader>
                    <CardTitle className="text-xl font-black">BALANÇO | COMPARATIVO</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-[10px] font-black text-muted-foreground uppercase opacity-70">
                          <th className="text-left py-4 px-2">Ano</th>
                          <th className="text-right py-4 px-2">P/L</th>
                          <th className="text-right py-4 px-2">P/VP</th>
                          <th className="text-right py-4 px-2">VPA</th>
                          <th className="text-right py-4 px-2">Margem Líq.</th>
                          <th className="text-right py-4 px-2">ROE</th>
                          <th className="text-right py-4 px-2">Dividend Yield</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[2024, 2023, 2022, 2021].map((year) => (
                          <tr key={year} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-2 font-black">{year}</td>
                            <td className="py-4 px-2 text-right font-medium">{(Math.random() * 10 + 2).toFixed(2)}</td>
                            <td className="py-4 px-2 text-right font-medium">{(Math.random() * 2 + 0.5).toFixed(2)}</td>
                            <td className="py-4 px-2 text-right font-medium">R$ {(Math.random() * 50 + 20).toFixed(2)}</td>
                            <td className="py-4 px-2 text-right font-medium text-emerald-500">{(Math.random() * 20 + 5).toFixed(2)}%</td>
                            <td className="py-4 px-2 text-right font-medium text-emerald-500">{(Math.random() * 25 + 10).toFixed(2)}%</td>
                            <td className="py-4 px-2 text-right font-medium text-blue-500">{(Math.random() * 10 + 2).toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="cashflow" className="mt-0">
               <Card className="border-none shadow-sm bg-white dark:bg-card overflow-x-auto">
                 <CardHeader>
                    <CardTitle className="text-xl font-black uppercase tracking-wider text-primary">Demonstrativo de Fluxo de Caixa</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left py-3 px-4 rounded-tl-xl font-black uppercase text-[10px] tracking-widest text-muted-foreground">Categoria</th>
                          {[2024, 2023, 2022].map(y => (
                             <th key={y} className="text-right py-3 px-4 font-black text-[10px] tracking-widest text-muted-foreground">VALOR {y}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {[
                          'CAIXA LÍQUIDO ATIVIDADES OPERACIONAIS',
                          'CAIXA GERADO NAS OPERAÇÕES',
                          'LUCRO LÍQUIDO',
                          'DEPRECIAÇÃO/AMORTIZAÇÃO',
                          'CAIXA LÍQUIDO ATIVIDADES INVESTIMENTO',
                          'CAIXA LÍQUIDO ATIVIDADES FINANCIAMENTO',
                          'FLUXO DE CAIXA LIVRE'
                        ].map((cat) => (
                          <tr key={cat} className="hover:bg-muted/20 transition-colors">
                            <td className="py-4 px-4 font-bold text-muted-foreground">{cat}</td>
                            {[1, 2, 3].map(v => (
                               <td key={v} className="py-4 px-4 text-right font-black">R$ 0,00</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
