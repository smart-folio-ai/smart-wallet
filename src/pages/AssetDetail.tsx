import {useState} from 'react';
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
  Landmark,
} from '@/components/ui/icons';
import {SectionHeader, DataTable, TD_STYLE, TD_RIGHT} from '@/components/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {RobotIcon} from '@/components/ui/robot-icon';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
import {getAssetOpinion} from '@/services/ai/assetOpinion';
import {RagAskPanel} from '@/components/ai/RagAskPanel';
import {IndicatorItem as FundamentalIndicatorItem} from '@/components/asset/indicator-item';
import {readIndicator} from '@/pages/asset-fundamentals.utils';
import type {FundamentalKey} from '@/pages/asset-fundamentals.utils';
import {CapitalRatioGauge} from '@/components/asset/capital-ratio-gauge';
import {buildBankCapitalSummary, formatBankCapitalPeriod} from './bank-capital-summary';

/**
 * Le a cascata UMA vez por linha e distribui status/value/source do mesmo
 * resultado. Nao existe um segundo literal de chave capaz de divergir do
 * primeiro, entao a linha nunca mostra o numero de um indicador sob o
 * rotulo/status de outro.
 *
 * Tambem nao aceita `isRestricted`: o gate de restricao do brapi nao governa
 * estes valores, que vem da cascata do server. A honestidade da linha vem dos
 * proprios estados `unavailable`/`not_applicable`.
 */
function FundamentalRow({
  label,
  fundamentals,
  indicatorKey,
  formatter,
}: {
  label: string;
  fundamentals: unknown;
  indicatorKey: FundamentalKey;
  formatter?: (value: number) => string;
}) {
  const {status, value, source} = readIndicator(fundamentals, indicatorKey);

  return (
    <FundamentalIndicatorItem
      label={label}
      status={status}
      value={value}
      source={source}
      formatter={formatter}
    />
  );
}

export default function AssetDetail() {
  const {symbol} = useParams<{symbol: string}>();
  const navigate = useNavigate();
  const {hasAiInsights} = useSubscription();
  const [period, setPeriod] = useState('3mo');
  const [activeTab, setActiveTab] = useState('overview');

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
        dividendYield: s.dividendYield ?? null,
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
        /**
         * Ausencia vira `null`, nunca `0`. Este bloco alimenta o payload da
         * Opiniao IA; um `0` fabricado seria lido como medicao real e
         * reprovaria um check de benchmark que deveria ser apenas pulado —
         * fazendo a IA contradizer o card de Indicadores, que ja declara
         * ausencia com honestidade.
         */
        indicators: {
          valuation: {
            pe: s.priceEarnings ?? null,
            pb: s.priceToBook ?? null,
            pvp: s.priceToBook ?? null,
            ev_ebitda: s.enterpriseValueEbitda ?? null,
            price_sales: s.priceSales ?? null,
          },
          debt: {
            debt_equity: s.debtToEquity ?? null,
            current_ratio: s.currentRatio ?? null,
            quick_ratio: s.quickRatio ?? null,
            debt_ebitda: s.totalDebtToEbitda ?? null,
          },
          efficiency: {
            roe: s.returnOnEquity ?? null,
            roa: s.returnOnAssets ?? null,
            roic: s.returnOnInvestedCapital ?? null,
            gross_margin: s.grossMargins ?? null,
            net_margin: s.netMargin ?? null,
          },
          profitability: {
            revenue_growth: s.revenueGrowth ?? null,
            earnings_growth: s.earningsGrowth ?? null,
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

  const fundamentals = s?.fundamentals ?? null;

  const bankCapital = s?.bankCapital ?? null;
  const bankCapitalSummary = bankCapital
    ? buildBankCapitalSummary({
        basileia: bankCapital.basileia,
        imobilizacao: bankCapital.imobilizacao,
      })
    : null;
  const bankCapitalPeriod = bankCapital ? formatBankCapitalPeriod(bankCapital.period) : null;

  const calculateGrahamValue = () => {
    if (!asset || isFundamentalRestricted) return 0;
    // Brapi usually uses epsTrailingTwelveMonths and priceToBook/bookValuePerShare
    const eps = s.epsTrailingTwelveMonths || s.earningsPerShare || 0;
    const bvps =
      s.bookValuePerShare || s.regularMarketPrice / (s.priceToBook || 1) || 0;

    if (eps <= 0 || bvps <= 0) return 0;
    return Math.sqrt(22.5 * eps * bvps);
  };

  const grahamValue = calculateGrahamValue();
  const upside =
    asset && grahamValue > 0 ? (grahamValue / asset.price - 1) * 100 : 0;
  const isUndervalued = asset && grahamValue > asset.price;
  const {data: assetOpinion, isFetching: isLoadingAssetOpinion} = useQuery({
    // Sem os campos de mercado na queryKey: o server busca o snapshot atual
    // por conta própria a cada chamada (POST /ai/asset-opinion), então a
    // resposta já reflete o preço/indicadores do momento sem precisar disso
    // aqui para invalidar o cache do React Query.
    queryKey: ['asset-opinion', symbol],
    queryFn: async () => getAssetOpinion(asset?.symbol || symbol || ''),
    enabled: Boolean(asset?.symbol && hasAiInsights),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const getOpinionTagStyle = (tag: string) => {
    const normalized = String(tag || '')
      .trim()
      .toLowerCase();

    if (normalized.startsWith('score_')) {
      return {
        label: `Score ${normalized.replace('score_', '')}`,
        className:
          'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30',
      };
    }

    // AssetOpinionService (server) não emite mais COMPRA/HOLD/VENDA/TOP/BOM/
    // EVITAR (TRA-9, TRA-53) — as demais tags são nomes de pilar
    // (qualidade, risco controlado, ...) e caem no estilo genérico abaixo.
    return {
      label: tag,
      className: 'bg-primary/10 text-primary border border-primary/20',
    };
  };

  const currentYear = new Date().getFullYear();
  const cashflowYears = [currentYear, currentYear - 1, currentYear - 2];
  const financialHistoryData = Array.isArray(s?.financialHistory)
    ? [...s.financialHistory]
        .filter((row: any) => typeof row?.year === 'number')
        .sort((a: any, b: any) => a.year - b.year)
        .map((row: any) => ({
          year: row.year,
          revenue: Number(row.revenue || 0),
          profit: Number(row.netIncome || 0),
          totalAssets: Number(row.totalAssets || 0),
          shareholdersEquity: Number(row.shareholdersEquity || 0),
        }))
    : [];
  const cashflowHistoryByYear = new Map<number, any>(
    (Array.isArray(s?.cashflowHistory) ? s.cashflowHistory : []).map(
      (row: any) => [Number(row?.year), row],
    ),
  );

  const getNumericValue = (source: any, keys: string[]): number | null => {
    for (const key of keys) {
      const value = key
        .split('.')
        .reduce<any>((acc, part) => (acc ? acc[part] : undefined), source);
      if (typeof value === 'number' && Number.isFinite(value)) return value;
    }
    return null;
  };

  const cashflowRows = [
    {
      label: 'CAIXA LÍQUIDO ATIVIDADES OPERACIONAIS',
      values: {
        [currentYear]:
          getNumericValue(cashflowHistoryByYear.get(currentYear), [
            'operatingCashflow',
          ]) ??
          getNumericValue(s, [
            'operatingCashflow',
            'financialData.operatingCashflow',
          ]),
        [currentYear - 1]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 1),
          ['operatingCashflow'],
        ),
        [currentYear - 2]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 2),
          ['operatingCashflow'],
        ),
      },
    },
    {
      label: 'CAIXA GERADO NAS OPERAÇÕES',
      values: {
        [currentYear]:
          getNumericValue(cashflowHistoryByYear.get(currentYear), [
            'operatingCashflow',
          ]) ??
          getNumericValue(s, [
            'operatingCashflow',
            'financialData.operatingCashflow',
          ]),
        [currentYear - 1]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 1),
          ['operatingCashflow'],
        ),
        [currentYear - 2]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 2),
          ['operatingCashflow'],
        ),
      },
    },
    {
      label: 'LUCRO LÍQUIDO',
      values: {
        [currentYear]:
          getNumericValue(cashflowHistoryByYear.get(currentYear), [
            'netIncome',
          ]) ??
          getNumericValue(s, ['netIncomeToCommon', 'financialData.netIncome']),
        [currentYear - 1]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 1),
          ['netIncome'],
        ),
        [currentYear - 2]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 2),
          ['netIncome'],
        ),
      },
    },
    {
      label: 'DEPRECIAÇÃO/AMORTIZAÇÃO',
      values: {
        [currentYear]:
          getNumericValue(cashflowHistoryByYear.get(currentYear), [
            'depreciation',
          ]) ??
          getNumericValue(s, ['depreciation', 'depreciationAndAmortization']),
        [currentYear - 1]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 1),
          ['depreciation'],
        ),
        [currentYear - 2]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 2),
          ['depreciation'],
        ),
      },
    },
    {
      label: 'CAIXA LÍQUIDO ATIVIDADES INVESTIMENTO',
      values: {
        [currentYear]:
          getNumericValue(cashflowHistoryByYear.get(currentYear), [
            'investingCashflow',
          ]) ??
          getNumericValue(s, [
            'investingCashflow',
            'cashflowFromInvestment',
            'capitalExpenditures',
          ]),
        [currentYear - 1]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 1),
          ['investingCashflow'],
        ),
        [currentYear - 2]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 2),
          ['investingCashflow'],
        ),
      },
    },
    {
      label: 'CAIXA LÍQUIDO ATIVIDADES FINANCIAMENTO',
      values: {
        [currentYear]:
          getNumericValue(cashflowHistoryByYear.get(currentYear), [
            'financingCashflow',
          ]) ??
          getNumericValue(s, ['financingCashflow', 'cashflowFromFinancing']),
        [currentYear - 1]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 1),
          ['financingCashflow'],
        ),
        [currentYear - 2]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 2),
          ['financingCashflow'],
        ),
      },
    },
    {
      label: 'FLUXO DE CAIXA LIVRE',
      values: {
        [currentYear]:
          getNumericValue(cashflowHistoryByYear.get(currentYear), [
            'freeCashflow',
          ]) ??
          getNumericValue(s, ['freeCashflow', 'financialData.freeCashflow']),
        [currentYear - 1]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 1),
          ['freeCashflow'],
        ),
        [currentYear - 2]: getNumericValue(
          cashflowHistoryByYear.get(currentYear - 2),
          ['freeCashflow'],
        ),
      },
    },
  ];

  const hasAnyCashflowData = cashflowRows.some((row) =>
    cashflowYears.some(
      (year) => row.values[year as keyof typeof row.values] !== null,
    ),
  );

  const GrahamGauge = ({
    price,
    fairValue,
  }: {
    price: number;
    fairValue: number;
  }) => {
    const computedUpside =
      fairValue > 0 && price > 0 ? (fairValue / price - 1) * 100 : 0;
    const clampedUpside = Math.max(-60, Math.min(100, computedUpside));
    const progress = (clampedUpside + 60) / 160; // 0..1
    const rotateDeg = -90 + progress * 180;
    const cx = 120;
    const cy = 120;
    const radius = 88;

    const arcPath = (startDeg: number, endDeg: number) => {
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const startX = cx + radius * Math.cos(toRad(startDeg));
      const startY = cy - radius * Math.sin(toRad(startDeg));
      const endX = cx + radius * Math.cos(toRad(endDeg));
      const endY = cy - radius * Math.sin(toRad(endDeg));
      // sweep-flag 1: no SVG o eixo Y cresce para baixo, entao o arco que
  // sobe pela esquerda, passa pelo topo e desce a direita e o SENTIDO
  // HORARIO. Com 0 cada faixa curvava para o lado oposto e o medidor
  // virava um bico em vez de um semicirculo.
  return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
    };

    return (
      <div className="relative flex flex-col items-center">
        <div className="relative h-[112px] w-full flex items-end justify-center sm:h-[130px]">
          <svg
            viewBox="0 0 240 130"
            className="absolute bottom-0 h-[104px] w-[200px] overflow-visible sm:h-[120px] sm:w-[240px]">
            <path
              d={arcPath(180, 0)}
              stroke="hsl(var(--muted) / 0.2)"
              strokeWidth="26"
              fill="none"
              strokeLinecap="butt"
            />
            <path
              d={arcPath(180, 135)}
              stroke="#f43f5e"
              strokeWidth="26"
              fill="none"
              strokeLinecap="butt"
            />
            <path
              d={arcPath(135, 90)}
              stroke="#facc15"
              strokeWidth="26"
              fill="none"
              strokeLinecap="butt"
            />
            <path
              d={arcPath(90, 45)}
              stroke="#3b82f6"
              strokeWidth="26"
              fill="none"
              strokeLinecap="butt"
            />
            <path
              d={arcPath(45, 0)}
              stroke="#22c55e"
              strokeWidth="26"
              fill="none"
              strokeLinecap="butt"
            />
          </svg>
          <div
            className="absolute bottom-0 left-1/2 h-[90px] w-[3px] bg-slate-800 dark:bg-white origin-bottom rounded-full transition-transform duration-700"
            style={{
              transform: `translateX(-50%) rotate(${rotateDeg}deg)`,
            }}
          />
          <div className="absolute bottom-[-6px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-slate-800 dark:bg-white" />
        </div>

        <div className="text-center mt-2 flex flex-col items-center gap-1">
          <Badge
            variant={isUndervalued ? 'default' : 'destructive'}
            className="text-[10px] font-black tracking-widest uppercase">
            {isUndervalued ? 'Ação Descontada' : 'Ação sobrevalorizada'}
          </Badge>
          <div className="flex flex-col items-center gap-0.5 mt-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
              Upside Potencial
            </span>
            <span
              className={`text-xl font-black ${upside >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {upside >= 0 ? '+' : ''}
              {upside.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="mt-3 grid w-full max-w-[320px] grid-cols-2 gap-2 text-center">
          <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1.5">
            <span className="whitespace-nowrap text-[9px] font-bold text-rose-400 sm:text-[10px]">
              Sobrevalorizada
            </span>
          </div>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5">
            <span className="whitespace-nowrap text-[9px] font-bold text-amber-400 sm:text-[10px]">
              Atenção
            </span>
          </div>
          <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1.5">
            <span className="whitespace-nowrap text-[9px] font-bold text-blue-400 sm:text-[10px]">
              Neutra
            </span>
          </div>
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5">
            <span className="whitespace-nowrap text-[9px] font-bold text-emerald-400 sm:text-[10px]">
              Oportunidade
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

  const IndicatorItem = ({
    label,
    value,
    isRestricted,
    formatter = (v: any) => v,
  }: any) => {
    if (
      isRestricted ||
      value === 0 ||
      value === undefined ||
      value === null
    )
      return renderRestricted(label);
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
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16}}>
        <h1 style={{fontSize: 22, fontWeight: 600}}>Ativo não encontrado</h1>
        <Button onClick={() => navigate('/asset-search')}>Buscar Outro Ativo</Button>
      </div>
    );
  }

  const currentPrice = asset.price;
  const priceChange = asset.changeAbsolute;
  const priceChangePct = Math.abs(asset.change24h).toFixed(2);
  const name = asset.name;
  const sector = asset.sector;

  const ASSET_TABS = [
    {id: 'overview', label: 'Visão geral'},
    {id: 'fundamentals', label: 'Indicadores'},
    {id: 'balance', label: 'Balanço'},
    {id: 'results', label: 'Resultados'},
    {id: 'dividends', label: 'Dividendos'},
    {id: 'about', label: 'Sobre'},
  ];

  const heroStats = [
    {label: 'Qtd de ações', value: '—'},
    {label: 'P&L total', value: '—'},
    {label: 'Peso', value: '—'},
  ];

  const positionStats = [
    {label: 'Qtd', value: '—'},
    {label: 'Preço médio', value: '—'},
    {label: 'Valor investido', value: '—'},
    {label: 'Valor atual', value: '—'},
    {label: 'P&L total', value: '—'},
  ];

  const onRegisterOp = () => navigate('/portfolio');

  // ── Tab content functions (defined as closures to access component vars) ──

  function AssetOverviewTab() {
    return (
      <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 22.4, alignItems: 'start'}}>
        {/* Left: chart + quick info + AI opinion */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 22.4}}>
          {/* Chart card */}
          <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
            <SectionHeader
              title="Cotação"
              action={
                <div style={{display: 'flex', gap: 2.8, padding: 2.8, border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.8)'}}>
                  {['5d','1mo','3mo','6mo','1y','5y'].map((p) => (
                    <button key={p} type="button" onClick={() => setPeriod(p)}
                      style={period === p
                        ? {height: 26, padding: '0 10px', fontSize: 11, border: 'none', borderRadius: 6, background: 'var(--nk-card)', color: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600}
                        : {height: 26, padding: '0 10px', fontSize: 11, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'pointer', fontFamily: 'var(--font-body)'}}>
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              }
            />
            <div style={{padding: '16px 16.8px'}}>
              <div style={{height: 320}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={asset.history}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={asset.change24h >= 0 ? 'rgb(16,185,129)' : 'rgb(244,63,94)'} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={asset.change24h >= 0 ? 'rgb(16,185,129)' : 'rgb(244,63,94)'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600}} minTickGap={40} dy={10} />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="price" stroke={asset.change24h >= 0 ? '#10b981' : '#f43f5e'} strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick info grid */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 11.2}}>
            {[
              {label: 'Market Cap', value: s?.marketCap, formatter: (v: number) => `R$ ${(v / 1e9).toFixed(2)}B`, Icon: Building2},
              {label: 'Volume (24h)', value: s?.regularMarketVolume, formatter: (v: number) => `R$ ${(v / 1e6).toFixed(2)}M`, Icon: BarChart3},
              {label: 'Mín 52s', value: s?.fiftyTwoWeekLow, formatter: formatCurrency, Icon: TrendingDown},
              {label: 'Máx 52s', value: s?.fiftyTwoWeekHigh, formatter: formatCurrency, Icon: TrendingUp},
            ].map((item, idx) => (
              <div key={idx} style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', padding: '14px 16.8px'}}>
                <div style={{fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-500)', marginBottom: 8}}>{item.label}</div>
                <div style={{fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{item.value ? item.formatter(item.value) : '—'}</div>
              </div>
            ))}
          </div>

          {/* AI Opinion */}
          <PremiumBlur locked={!hasAiInsights} title="Opinião Trackerr IA é Premium" description="Faça upgrade para acessar análise contextual com IA no detalhe do ativo.">
            <div className="rounded-lg" style={{border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
              <SectionHeader
                title="Opinião Trackerr IA"
                subtitle="Análise contextual baseada em fundamentos e sentimento de mercado"
                action={<span style={{fontSize: 10.5, fontWeight: 600, color: 'var(--color-accent-100)', border: '1px solid rgba(145,132,217,0.45)', borderRadius: 6, padding: '2px 7px', background: 'rgba(145,132,217,0.16)'}}>Premium</span>}
              />
              <div style={{padding: '14px 16.8px', display: 'flex', flexDirection: 'column', gap: 14}}>
                <div style={{display: 'flex', gap: 14, padding: 14, borderRadius: 8, background: 'var(--surf-2)', border: '1px solid var(--hair-soft)'}}>
                  <div style={{width: 36, height: 36, borderRadius: '50%', background: 'rgba(145,132,217,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                    <RobotIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                    <p style={{fontSize: 13, lineHeight: 1.5, color: 'var(--color-neutral-300)'}}>
                      {isLoadingAssetOpinion ? 'Gerando análise da IA para este ativo...' : assetOpinion?.summary || 'Análise contextual indisponível no momento.'}
                    </p>
                    {Array.isArray(assetOpinion?.tags) && assetOpinion.tags.length > 0 && (
                      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
                        {assetOpinion.tags.map((tag) => {
                          const tagStyle = getOpinionTagStyle(tag);
                          return <span key={tag} className={`rounded-full px-2 py-1 text-[11px] font-bold ${tagStyle.className}`}>{tagStyle.label}</span>;
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11.2}}>
                  <div style={{padding: 14, borderRadius: 8, background: 'var(--surf-2)', border: '1px solid var(--hair-soft)'}}>
                    <p style={{fontSize: 10, fontWeight: 700, color: 'var(--pos)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6}}>Ponto Forte</p>
                    <p style={{fontSize: 12, color: 'var(--color-neutral-400)'}}>
                      {isLoadingAssetOpinion ? 'Carregando ponto forte...' : assetOpinion?.strength || 'A leitura atual mostra sinais operacionais mistos.'}
                    </p>
                  </div>
                  <div style={{padding: 14, borderRadius: 8, background: 'var(--surf-2)', border: '1px solid var(--hair-soft)'}}>
                    <p style={{fontSize: 10, fontWeight: 700, color: 'var(--warn)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6}}>Atenção</p>
                    <p style={{fontSize: 12, color: 'var(--color-neutral-400)'}}>
                      {isLoadingAssetOpinion ? 'Carregando ponto de atenção...' : assetOpinion?.attention || 'Monitore fundamentos e contexto macro para validar a tese.'}
                    </p>
                  </div>
                </div>
                <div style={{paddingTop: 11.2, borderTop: '1px solid var(--hair-soft)'}}>
                  <RagAskPanel
                    contextLabel={asset.symbol}
                    placeholder={`Pergunte sobre ${asset.symbol} na sua carteira...`}
                    quickPrompts={[`${asset.symbol} faz sentido pra minha carteira?`, `Qual o peso de ${asset.symbol} na minha carteira?`]}
                  />
                </div>
              </div>
            </div>
          </PremiumBlur>
        </div>

        {/* Right: indicators + graham + bank capital */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
          {/* Indicators card */}
          <div data-testid="indicators-card" style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
            <SectionHeader title="Indicadores" />
            <div style={{padding: '14px 16.8px', display: 'flex', flexDirection: 'column', gap: 22.4}}>
              <div>
                <div style={{fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent-100)', marginBottom: 11.2}}>Valuation</div>
                <IndicatorItem label="DIVIDEND YIELD" value={asset.dividendYield} isRestricted={isDividendsRestricted} formatter={formatPercentage} />
                <FundamentalRow label="P/L (PREÇO/LUCRO)" fundamentals={fundamentals} indicatorKey="priceEarnings" formatter={(v: number) => v.toFixed(2)} />
                <FundamentalRow label="P/VP" fundamentals={fundamentals} indicatorKey="priceToBook" formatter={(v: number) => v.toFixed(2)} />
                <FundamentalRow label="EV/EBITDA" fundamentals={fundamentals} indicatorKey="evEbitda" formatter={(v: number) => v.toFixed(2)} />
              </div>
              <div>
                <div style={{fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent-100)', marginBottom: 11.2}}>Eficiência &amp; Rentabilidade</div>
                <FundamentalRow label="ROE" fundamentals={fundamentals} indicatorKey="returnOnEquity" formatter={formatPercentage} />
                <FundamentalRow label="ROIC" fundamentals={fundamentals} indicatorKey="roic" formatter={formatPercentage} />
                <FundamentalRow label="MARGEM LÍQUIDA" fundamentals={fundamentals} indicatorKey="netMargin" formatter={formatPercentage} />
                <FundamentalRow label="DÍVIDA LÍQUIDA" fundamentals={fundamentals} indicatorKey="netDebt" formatter={formatCurrency} />
              </div>
              <div>
                <div style={{fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent-100)', marginBottom: 11.2}}>Dividendos</div>
                <IndicatorItem label="ÚLTIMO DIVIDENDO" value={asset.lastDividend} isRestricted={isDividendsRestricted} formatter={formatCurrency} />
                <FundamentalRow label="PAYOUT" fundamentals={fundamentals} indicatorKey="payout" formatter={formatPercentage} />
                {asset.dividendHistory.length > 0 && !isDividendsRestricted && (
                  <div style={{marginTop: 11.2, paddingTop: 11.2, borderTop: '1px solid var(--hair-soft)'}}>
                    <div style={{fontSize: 10, fontWeight: 600, color: 'var(--color-neutral-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em'}}>Histórico recente</div>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: 6}}>
                      {asset.dividendHistory.slice(0, 3).map((d: any, i: number) => (
                        <div key={i} style={{padding: '3px 8px', background: 'var(--surf-2)', borderRadius: 6, fontSize: 10.5, fontWeight: 600}}>
                          {d.date}: {formatCurrency(d.value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Graham gauge card */}
          <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
            <SectionHeader
              title="Preço Justo (Graham)"
              action={<Calculator className="h-4 w-4" style={{color: 'var(--color-accent-100)'}} />}
            />
            <div style={{padding: '14px 16.8px'}}>
              {isFundamentalRestricted ? (
                <div style={{display: 'flex', justifyContent: 'center', padding: '28px 0'}}>
                  <Badge variant="outline" className="border-dashed opacity-50">EM BREVE</Badge>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <div style={{fontSize: 10, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4}}>Valor Intrínseco</div>
                      <div style={{fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--color-accent-100)', fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(grahamValue)}</div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <div style={{fontSize: 10, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4}}>Preço Atual</div>
                      <div style={{fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-heading)', fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(asset.price)}</div>
                    </div>
                  </div>
                  <GrahamGauge price={asset.price} fairValue={grahamValue} />
                </div>
              )}
            </div>
          </div>

          {/* Bank capital card */}
          {bankCapital && (
            <div data-testid="bank-capital-card" style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
              <SectionHeader
                title={`Capital Regulatório — ${bankCapital.bankName}${bankCapitalPeriod ? ` · ${bankCapitalPeriod}` : ''}`}
                action={<Landmark className="h-4 w-4" style={{color: 'var(--color-accent-100)'}} />}
              />
              <div style={{padding: '14px 16.8px', display: 'flex', flexDirection: 'column', gap: 22.4}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16.8}}>
                  <CapitalRatioGauge label="ÍNDICE DE BASILEIA" value={bankCapital.basileia} maxScale={30} />
                  <CapitalRatioGauge label="ÍNDICE DE IMOBILIZAÇÃO" value={bankCapital.imobilizacao} maxScale={60} dangerAbove={50} />
                </div>
                {bankCapitalSummary && (
                  <p style={{fontSize: 11, textAlign: 'center', color: 'var(--color-neutral-500)'}}>{bankCapitalSummary}</p>
                )}
              </div>
            </div>
          )}

          {/* Company website */}
          {asset.company.website && (
            <a href={asset.company.website} target="_blank" rel="noopener noreferrer"
              style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16.8px', borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', textDecoration: 'none', color: 'inherit'}}>
              <span style={{fontSize: 13, fontWeight: 600, color: 'var(--color-neutral-300)'}}>Site de RI da Empresa</span>
              <ExternalLink className="h-4 w-4" style={{color: 'var(--color-neutral-500)'}} />
            </a>
          )}
        </div>
      </div>
    );
  }

  function AssetFundamentalsTab() {
    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
        <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
          <SectionHeader title="Valuation" />
          <div style={{padding: '8px 16.8px 14px'}}>
            <FundamentalRow label="P/L (PREÇO/LUCRO)" fundamentals={fundamentals} indicatorKey="priceEarnings" formatter={(v: number) => v.toFixed(2)} />
            <FundamentalRow label="P/VP" fundamentals={fundamentals} indicatorKey="priceToBook" formatter={(v: number) => v.toFixed(2)} />
            <FundamentalRow label="EV/EBITDA" fundamentals={fundamentals} indicatorKey="evEbitda" formatter={(v: number) => v.toFixed(2)} />
            <IndicatorItem label="DIVIDEND YIELD" value={asset.dividendYield} isRestricted={isDividendsRestricted} formatter={formatPercentage} />
          </div>
        </div>
        <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
          <SectionHeader title="Eficiência &amp; Rentabilidade" />
          <div style={{padding: '8px 16.8px 14px'}}>
            <FundamentalRow label="ROE" fundamentals={fundamentals} indicatorKey="returnOnEquity" formatter={formatPercentage} />
            <FundamentalRow label="ROIC" fundamentals={fundamentals} indicatorKey="roic" formatter={formatPercentage} />
            <FundamentalRow label="MARGEM LÍQUIDA" fundamentals={fundamentals} indicatorKey="netMargin" formatter={formatPercentage} />
            <FundamentalRow label="DÍVIDA LÍQUIDA" fundamentals={fundamentals} indicatorKey="netDebt" formatter={formatCurrency} />
            <IndicatorItem label="ÚLTIMO DIVIDENDO" value={asset.lastDividend} isRestricted={isDividendsRestricted} formatter={formatCurrency} />
            <FundamentalRow label="PAYOUT" fundamentals={fundamentals} indicatorKey="payout" formatter={formatPercentage} />
          </div>
        </div>
      </div>
    );
  }

  function AssetBalanceTab() {
    return (
      <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
        <SectionHeader title="Balanço Patrimonial" subtitle="Resultados anuais" />
        {isFundamentalRestricted ? (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '44px 0', gap: 8, opacity: 0.5}}>
            <Clock className="h-10 w-10" style={{color: 'var(--color-neutral-500)'}} />
            <p style={{fontWeight: 600, fontSize: 13}}>Dados financeiros detalhados em breve</p>
            <p style={{fontSize: 11, color: 'var(--color-neutral-500)'}}>Requer upgrade no plano da API Brapi</p>
          </div>
        ) : (
          <DataTable columns={[{label: 'Item'}, {label: 'Valor', align: 'right'}]}>
            <tr><td style={TD_STYLE}>Receita Líquida</td><td style={TD_RIGHT}>{formatCurrency(asset.financial.revenue)}</td></tr>
            <tr><td style={TD_STYLE}>Lucro Líquido</td><td style={TD_RIGHT}>{formatCurrency(asset.financial.net_income)}</td></tr>
            <tr><td style={TD_STYLE}>Patrimônio Líquido</td><td style={TD_RIGHT}>{formatCurrency(asset.financial.shareholders_equity)}</td></tr>
            <tr><td style={TD_STYLE}>Ativo Total</td><td style={TD_RIGHT}>{formatCurrency(asset.financial.total_assets)}</td></tr>
            <tr><td style={TD_STYLE}>Dívida Total</td><td style={TD_RIGHT}>{formatCurrency(asset.financial.total_debt)}</td></tr>
          </DataTable>
        )}
      </div>
    );
  }

  function AssetResultsTab() {
    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
        <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
          <SectionHeader title="Histórico de Lucro e Receita" action={<Badge variant="outline">5 anos</Badge>} />
          <div style={{padding: 16.8, height: 360}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialHistoryData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(Number(v))} />
                <Tooltip cursor={{fill: 'transparent'}} content={({active, payload, label}) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{background: 'var(--nk-card)', border: '1px solid var(--hair)', borderRadius: 8, padding: 14}}>
                        <p style={{fontWeight: 700, marginBottom: 8}}>{label}</p>
                        {payload.map((p: any, i: number) => (
                          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600}}>
                            <div style={{width: 8, height: 8, borderRadius: '50%', background: p.color}} />
                            <span style={{color: 'var(--color-neutral-500)'}}>{p.name}:</span>
                            <span>{formatCurrency(Number(p.value || 0))}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend iconType="circle" />
                <Bar dataKey="revenue" name="Receita Líquida" fill="#3b82f6" radius={[4,4,0,0]} barSize={40} />
                <Bar dataKey="profit" name="Lucro Líquido" fill="#10b981" radius={[4,4,0,0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
          <SectionHeader title="Balanço — Comparativo" />
          <DataTable columns={[
            {label: 'Ano'},
            {label: 'P/L', align: 'right'},
            {label: 'P/VP', align: 'right'},
            {label: 'VPA', align: 'right'},
            {label: 'Margem Líq.', align: 'right'},
            {label: 'ROE', align: 'right'},
            {label: 'Div. Yield', align: 'right'},
          ]} minWidth={640}>
            {financialHistoryData.slice().reverse().map((row: any) => {
              const rowYear = Number(row.year || 0);
              const rowRevenue = Number(row.revenue || 0);
              const rowProfit = Number(row.profit || 0);
              const rowEquity = Number(row.shareholdersEquity || 0);
              const rowRoe = rowEquity > 0 ? (rowProfit / rowEquity) * 100 : 0;
              const rowNetMargin = rowRevenue > 0 ? (rowProfit / rowRevenue) * 100 : 0;
              return (
                <tr key={rowYear}>
                  <td style={TD_STYLE}><strong>{rowYear || '-'}</strong></td>
                  <td style={TD_RIGHT}>{asset.price > 0 && rowProfit > 0 ? ((asset.price * (Number(s?.sharesOutstanding || 0) || 1)) / rowProfit).toFixed(2) : '—'}</td>
                  <td style={TD_RIGHT}>{rowEquity > 0 && asset.price > 0 ? (asset.price / (rowEquity / (Number(s?.sharesOutstanding || 0) || 1))).toFixed(2) : '—'}</td>
                  <td style={TD_RIGHT}>{rowEquity > 0 && Number(s?.sharesOutstanding || 0) > 0 ? formatCurrency(rowEquity / Number(s?.sharesOutstanding || 1)) : '—'}</td>
                  <td style={{...TD_RIGHT, color: 'var(--pos)'}}>{Number.isFinite(rowNetMargin) ? `${rowNetMargin.toFixed(2)}%` : '—'}</td>
                  <td style={{...TD_RIGHT, color: 'var(--pos)'}}>{Number.isFinite(rowRoe) ? `${rowRoe.toFixed(2)}%` : '—'}</td>
                  <td style={{...TD_RIGHT, color: 'var(--cy)'}}>{asset.dividendYield ? `${asset.dividendYield.toFixed(2)}%` : '—'}</td>
                </tr>
              );
            })}
          </DataTable>
          {financialHistoryData.length === 0 && (
            <p style={{padding: 16.8, fontSize: 11, color: 'var(--color-neutral-500)'}}>Ainda não recebemos histórico financeiro para este ativo nas fontes atuais.</p>
          )}
        </div>
        <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
          <SectionHeader title="Demonstrativo de Fluxo de Caixa" subtitle="Dados reais do ano mais recente. '—' indica ausência de dados." />
          <DataTable columns={[
            {label: 'Categoria'},
            ...cashflowYears.map((y) => ({label: `Valor ${y}`, align: 'right' as const})),
          ]} minWidth={560}>
            {cashflowRows.map((row) => (
              <tr key={row.label}>
                <td style={TD_STYLE}>{row.label}</td>
                {cashflowYears.map((year) => {
                  const val = row.values[year as keyof typeof row.values];
                  return <td key={year} style={TD_RIGHT}>{typeof val === 'number' ? formatCurrency(val) : '—'}</td>;
                })}
              </tr>
            ))}
          </DataTable>
          {!hasAnyCashflowData && (
            <p style={{padding: 16.8, fontSize: 11, color: 'var(--color-neutral-500)'}}>Ainda não recebemos dados de fluxo de caixa para este ativo nas fontes atuais.</p>
          )}
        </div>
      </div>
    );
  }

  function AssetDividendsTab() {
    return (
      <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
        <SectionHeader title="Histórico de Dividendos" />
        {isDividendsRestricted ? (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 0', gap: 8, opacity: 0.5}}>
            <p style={{fontWeight: 600, fontSize: 13}}>Dados de dividendos em breve</p>
          </div>
        ) : asset.dividendHistory.length === 0 ? (
          <p style={{padding: 16.8, fontSize: 12, color: 'var(--color-neutral-500)'}}>Sem histórico de dividendos disponível.</p>
        ) : (
          <DataTable columns={[{label: 'Data'}, {label: 'Valor por ação', align: 'right'}]}>
            {asset.dividendHistory.map((d: any, i: number) => (
              <tr key={i}>
                <td style={TD_STYLE}>{d.date}</td>
                <td style={TD_RIGHT}>{formatCurrency(d.value)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    );
  }

  function AssetAboutTab() {
    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
        <div style={{borderRadius: 8, border: '1px solid var(--hair)', background: 'var(--nk-card)', overflow: 'hidden'}}>
          <SectionHeader title="Descrição do Negócio" />
          <div style={{padding: 16.8}}>
            <p style={{fontSize: 14, lineHeight: 1.65, color: 'var(--color-neutral-400)', maxWidth: '72ch'}}>
              {asset.company.description || 'Descrição indisponível no momento.'}
            </p>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22.4, marginTop: 28, paddingTop: 22.4, borderTop: '1px solid var(--hair-soft)'}}>
              {[
                {label: 'Setor / Indústria', value: `${asset.company.sector} / ${asset.company.industry}`},
                {label: 'Sede', value: asset.company.headquarters || 'Não informado'},
                {label: 'Funcionários', value: asset.company.employees > 0 ? asset.company.employees.toLocaleString() : '—'},
              ].map((item) => (
                <div key={item.label}>
                  <div style={{fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-500)', marginBottom: 6}}>{item.label}</div>
                  <div style={{fontWeight: 600, fontSize: 13}}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>

      {/* Hero */}
      <section style={{position: 'relative', border: '1px solid rgba(145,132,217,0.30)', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(115deg, rgba(111,94,217,0.34) 0%, rgba(76,201,240,0.16) 48%, rgba(var(--rgb-surf-2),0.85) 100%), var(--surf-2)'}}>
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(520px 240px at 88% -20%, rgba(47,214,163,0.20), rgba(47,214,163,0) 70%)', pointerEvents: 'none'}} />
        <div style={{position: 'relative', padding: 22.4, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 22.4, alignItems: 'center'}}>
          {/* Left: identity + price */}
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: 11.2}}>
              <div style={{width: 40, height: 40, borderRadius: 8, background: 'var(--grad-violet)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: 'var(--sunk)', boxShadow: '0 0 24px rgba(145,132,217,0.40)'}}>
                {symbol?.slice(0, 4)}
              </div>
              <div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8.4}}>
                  <span style={{fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em'}}>{symbol}</span>
                  <span style={{fontSize: 10.5, color: 'var(--color-accent-100)', border: '1px solid rgba(145,132,217,0.45)', borderRadius: 6, padding: '2px 7px', background: 'rgba(145,132,217,0.16)'}}>{sector}</span>
                </div>
                <div style={{fontSize: 12, color: 'var(--color-neutral-400)', marginTop: 3}}>{name} · B3 · lote padrão</div>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', gap: 16.8, marginTop: 16.8, flexWrap: 'wrap'}}>
              <div>
                <div style={{fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>
                  {formatCurrency(currentPrice)}
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8.4, marginTop: 5.6, fontSize: 12.5}}>
                  <span style={{color: priceChange >= 0 ? 'var(--pos)' : 'var(--neg)'}}>{priceChange >= 0 ? '+' : '-'}{priceChangePct}%</span>
                  <span style={{color: 'var(--color-neutral-500)'}}>hoje · {formatCurrency(priceChange)}</span>
                </div>
              </div>
              <div style={{display: 'flex', gap: 22.4, paddingLeft: 22.4, borderLeft: '1px solid var(--hair)'}}>
                {heroStats.map((stat) => (
                  <div key={stat.label}>
                    <div style={{fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-500)'}}>{stat.label}</div>
                    <div style={{fontSize: 15, fontWeight: 600, marginTop: 4, fontVariantNumeric: 'tabular-nums', color: (stat as any).color ?? 'var(--color-neutral-200)'}}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: position mini-card */}
          <div style={{border: '1px solid rgba(var(--rgb-line),0.14)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.62)', backdropFilter: 'blur(8px)', padding: '14px 16.8px'}}>
            <div style={{fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-500)'}}>Sua posição</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8.4, marginTop: 11.2}}>
              {positionStats.map((p) => (
                <div key={p.label} style={{display: 'flex', alignItems: 'baseline', gap: 11.2, fontSize: 12.5}}>
                  <span style={{flex: 1, color: 'var(--color-neutral-500)'}}>{p.label}</span>
                  <span style={{fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: (p as any).color ?? 'var(--color-neutral-200)'}}>{p.value}</span>
                </div>
              ))}
            </div>
            <div style={{display: 'flex', gap: 8.4, marginTop: 14}}>
              <button type="button" onClick={onRegisterOp} style={{flex: 1, height: 32, borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>
                Registrar operação
              </button>
              <button type="button" style={{height: 32, padding: '0 11.2px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-300)', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer'}}>
                Alertas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tab bar */}
      <div style={{display: 'flex', alignItems: 'center', gap: 11.2, flexWrap: 'wrap', borderBottom: '1px solid var(--hair)', paddingBottom: 11.2}}>
        <div style={{display: 'flex', gap: 2.8, padding: 2.8, border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.8)'}}>
          {ASSET_TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
              style={activeTab === t.id
                ? {height: 30, padding: '0 14px', fontSize: 12.5, border: 'none', borderRadius: 6, background: 'var(--nk-card)', color: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', fontFamily: 'var(--font-body)'}
                : {height: 30, padding: '0 14px', fontSize: 12.5, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'pointer', fontFamily: 'var(--font-body)'}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <AssetOverviewTab />}
      {activeTab === 'fundamentals' && <AssetFundamentalsTab />}
      {activeTab === 'balance' && <AssetBalanceTab />}
      {activeTab === 'results' && <AssetResultsTab />}
      {activeTab === 'dividends' && <AssetDividendsTab />}
      {activeTab === 'about' && <AssetAboutTab />}
    </div>
  );
}
