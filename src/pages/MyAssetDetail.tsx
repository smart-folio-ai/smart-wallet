import {useMemo, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import {useQuery} from '@tanstack/react-query';
import {
  formatCurrency,
  formatPctPtBr,
  formatPercentage,
  formatSignedPctPtBr,
} from '@/utils/formatters';
import {portfolioService} from '@/server/api/api';
import {PremiumBlur} from '@/components/ui/premium-blur';
import {useSubscription} from '@/hooks/useSubscription';
import {useSelectedPortfolio} from '@/contexts/SelectedPortfolioContext';
import Stock from '@/services/stocks';
import {getAssetOpinion} from '@/services/ai/assetOpinion';
import {
  calculateAssetProjection,
  getDefaultProjectionAnnualReturn,
  getDefaultProjectionTaxRate,
} from './asset-projection.utils';
import {DataTable, TD_STYLE, TD_RIGHT, SectionHeader} from '@/components/shared';
import {
  buildFinancialHistoryData,
  buildCashflowSection,
  readIndicator,
} from './asset-fundamentals.utils';
import {
  ASSET_CLASS_LABEL,
  describeAsset,
  resolvePositionPricing,
} from './portfolio-asset-display.utils';
import {
  FundamentalsTabContent,
  BalanceTabContent,
  ResultsTabContent,
  DividendsTabContent,
  AboutTabContent,
} from '@/components/asset/market-detail-tabs';

interface Transaction {
  _id: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  date: string;
  symbol?: string;
}

/** Abas do handoff (`assetTabs` em Trackerr App.dc.html). */
const TAB_DEFS = [
  {id: 'overview', label: 'Visão geral'},
  {id: 'fundamentals', label: 'Indicadores'},
  {id: 'balance', label: 'Balanço'},
  {id: 'results', label: 'Resultados'},
  {id: 'dividends', label: 'Dividendos'},
  {id: 'about', label: 'Sobre'},
] as const;
type TabId = (typeof TAB_DEFS)[number]['id'];

const MARKET_TYPES = ['stock', 'fii', 'etf'];

const segStyle = (active: boolean): React.CSSProperties =>
  active
    ? {height: 26, padding: '0 12px', fontSize: 12, border: 'none', borderRadius: 6, background: 'var(--nk-card)', color: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', fontFamily: 'var(--font-body)'}
    : {height: 26, padding: '0 12px', fontSize: 12, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'pointer', fontFamily: 'var(--font-body)'};

const SECTION: React.CSSProperties = {border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'};

const MyAssetDetail = () => {
  const {assetId, symbol: symbolParam} = useParams<{assetId?: string; symbol?: string}>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const {hasAiInsights} = useSubscription();
  const {selectedId, isAll} = useSelectedPortfolio();

  const lookupSymbol = symbolParam ? decodeURIComponent(symbolParam).toUpperCase() : undefined;

  const {data: assetById, isLoading: loadingById} = useQuery({
    queryKey: ['assetDetails', assetId],
    queryFn: async () => (await portfolioService.getAssetDetails(assetId as string)).data,
    enabled: !!assetId,
  });

  // Todas as posições: peso na carteira, "ver outro ativo" e, pela rota de
  // símbolo, a posição somada de todas as contas.
  const {data: allAssets = [], isLoading: loadingAssets} = useQuery<any[]>({
    queryKey: ['portfolioAssets'],
    queryFn: async () => {
      const data = (await portfolioService.getAssets()).data;
      return Array.isArray(data) ? data : data?.assets ?? [];
    },
  });

  const scopedAssets = useMemo(
    () => (isAll ? allAssets : allAssets.filter((a) => String(a.portfolioId) === selectedId)),
    [allAssets, isAll, selectedId],
  );

  const asset = useMemo(() => {
    if (assetById) return assetById;
    if (!lookupSymbol) return null;
    const matches = scopedAssets.filter((a) => String(a.symbol).toUpperCase() === lookupSymbol);
    if (matches.length <= 1) return matches[0] ?? null;
    // Mesmo papel em mais de uma conta: soma quantidade, valor e custo.
    const quantity = matches.reduce((s, a) => s + Number(a.quantity || 0), 0);
    const cost = matches.reduce((s, a) => s + Number(a.avgPrice || 0) * Number(a.quantity || 0), 0);
    const everyHasCost = matches.every((a) => Number(a.avgPrice) > 0);
    return {
      ...matches[0],
      quantity,
      total: matches.reduce((s, a) => s + Number(a.total || 0), 0),
      avgPrice: everyHasCost && quantity > 0 ? cost / quantity : undefined,
      dividendHistory: matches.flatMap((a) => a.dividendHistory ?? []),
    };
  }, [assetById, lookupSymbol, scopedAssets]);

  const isLoading = loadingById || (!assetId && loadingAssets);
  const isMarketAsset = Boolean(asset?.symbol && MARKET_TYPES.includes(String(asset?.type || '').toLowerCase()));

  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [projectionYears, setProjectionYears] = useState(5);
  const [annualReturnRatePercent, setAnnualReturnRatePercent] = useState<number | null>(null);
  const [annualInflationRatePercent, setAnnualInflationRatePercent] = useState(4.5);
  const [annualTaxRatePercent, setAnnualTaxRatePercent] = useState<number | null>(null);

  const {data: transactions = []} = useQuery<Transaction[]>({
    queryKey: ['portfolio-transactions', 'asset', asset?.symbol],
    queryFn: async () => {
      const res = await portfolioService.getTransactions({symbol: asset.symbol});
      return res.data?.transactions || [];
    },
    enabled: !!asset?.symbol,
  });

  const {data: marketSnapshot} = useQuery({
    queryKey: ['asset-market-financials', asset?.symbol],
    queryFn: async () => {
      const response = await Stock.getNationalStock(asset.symbol, {
        fundamental: true,
        dividends: true,
        range: '5y',
        interval: '1mo',
      });
      return response?.results?.[0] ?? null;
    },
    enabled: isMarketAsset,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  const {data: opinion, isFetching: loadingOpinion} = useQuery({
    queryKey: ['asset-opinion', asset?.symbol],
    queryFn: () => getAssetOpinion(asset.symbol),
    enabled: Boolean(isMarketAsset && hasAiInsights),
    staleTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320}}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--surf-3)', borderTopColor: 'var(--ac)', animation: 'spin 0.8s linear infinite'}} />
      </div>
    );
  }

  if (!asset) {
    return (
      <section style={{...SECTION, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
        <div style={{fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600}}>Ativo não encontrado</div>
        <div style={{fontSize: 12.5, color: 'var(--color-neutral-500)'}}>
          {lookupSymbol ? `${lookupSymbol} não está na carteira selecionada.` : 'Esta posição não existe mais.'}
        </div>
        <button
          type="button"
          onClick={() => navigate('/portfolio')}
          style={{height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-200)', fontSize: 12.5, cursor: 'pointer'}}>
          Voltar ao portfólio
        </button>
      </section>
    );
  }

  // ── Dados de mercado (mesma leitura de `AssetDetail`, TRA-118) ─────────
  const marketData = marketSnapshot as any;
  const marketRestrictedData: string[] = marketData?.restrictedData || [];
  const isDividendsRestricted = marketRestrictedData.includes('dividends');
  const isFundamentalRestricted = marketRestrictedData.includes('fundamental');
  const marketFundamentals = marketData?.fundamentals ?? null;
  const marketDividendYield = marketData?.dividendYield ?? null;
  const marketLastDividend = marketData?.lastDividendValue ?? 0;
  const marketFinancial = {
    revenue: marketData?.totalRevenue ?? 0,
    net_income: marketData?.netIncomeToCommon ?? 0,
    total_assets: marketData?.totalAssets ?? 0,
    total_debt: marketData?.totalDebt ?? 0,
    shareholders_equity: marketData?.totalStockholderEquity ?? 0,
  };
  const marketCompany = {
    description: marketData?.longBusinessSummary ?? '',
    sector: marketData?.sector ?? '',
    industry: marketData?.industry ?? '',
    employees: marketData?.fullTimeEmployees ?? 0,
    headquarters: marketData?.city ? `${marketData.city}, ${marketData.state}` : '',
  };
  const marketDividendHistory = marketData?.dividendsData?.cashDividends
    ? marketData.dividendsData.cashDividends.map((d: any) => ({
        date: new Date(d.paymentDate).toLocaleDateString('pt-BR'),
        value: d.rate,
      }))
    : [];
  const marketCashflowSection = buildCashflowSection(marketData);
  const financialHistoryData = buildFinancialHistoryData(marketSnapshot);

  // ── Posição ────────────────────────────────────────────────────────────
  const display = describeAsset(asset);
  const quantity = Number(asset.quantity || 0);
  const pricing = resolvePositionPricing({
    ...asset,
    currentPrice: asset.currentPrice ?? marketData?.regularMarketPrice,
  });
  const price = pricing.marketPrice;
  const currentValue = price ? price * quantity : Number(asset.total || 0);
  const portfolioTotal = scopedAssets.reduce((s, a) => s + Number(a.total || 0), 0);
  const weightPct = portfolioTotal > 0 ? (Number(asset.total || currentValue) / portfolioTotal) * 100 : undefined;
  const dividendsReceived = (asset.dividendHistory ?? []).reduce(
    (s: number, d: any) => s + Number(d?.value || 0) * quantity,
    0,
  );
  const changePct = Number(marketData?.regularMarketChangePercent);
  const changeValue = Number(marketData?.regularMarketChange);
  const hasChange = Number.isFinite(changePct) && marketData?.regularMarketChangePercent != null;
  const closeTime = marketData?.regularMarketTime
    ? new Date(marketData.regularMarketTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})
    : null;
  const sectorLabel = [ASSET_CLASS_LABEL[asset.type] ?? asset.type, marketData?.sector].filter(Boolean).join(' · ');
  const companyName = marketData?.longName || display.subtitle || asset.name || asset.symbol;

  const heroStats = [
    {
      label: 'Seu resultado',
      value: pricing.pnlPct != null ? formatSignedPctPtBr(pricing.pnlPct) : '—',
      color: pricing.pnlPct == null ? undefined : pricing.pnlPct >= 0 ? 'var(--pos)' : 'var(--neg)',
    },
    {
      label: 'Peso na carteira',
      value: weightPct != null ? formatPctPtBr(weightPct, 1) : '—',
      color: weightPct != null && weightPct > 10 ? 'var(--warn)' : 'var(--color-neutral-100)',
    },
    {
      label: 'DY 12M',
      value: marketDividendYield != null ? formatPctPtBr(Number(marketDividendYield), 1) : '—',
      color: 'var(--color-neutral-100)',
    },
  ];

  const positionRows = [
    {label: 'Quantidade', value: quantity ? quantity.toLocaleString('pt-BR', {maximumFractionDigits: 8}) : '—'},
    {label: 'Preço médio', value: pricing.avgPrice ? formatCurrency(pricing.avgPrice) : '—'},
    {label: 'Valor atual', value: formatCurrency(currentValue)},
    {
      label: 'Lucro não realizado',
      value: pricing.pnlValue != null ? `${pricing.pnlValue >= 0 ? '+' : '−'}${formatCurrency(Math.abs(pricing.pnlValue))}` : '—',
      color: pricing.pnlValue == null ? undefined : pricing.pnlValue >= 0 ? 'var(--pos)' : 'var(--neg)',
    },
    {
      label: 'Proventos recebidos',
      value: formatCurrency(dividendsReceived),
      color: dividendsReceived > 0 ? 'var(--pos)' : undefined,
    },
  ];

  // Outras posições para "ver outro ativo": as maiores da carteira.
  const otherAssets = Array.from(
    scopedAssets
      .filter((a) => String(a.symbol).toUpperCase() !== String(asset.symbol).toUpperCase())
      .reduce((map, a) => map.set(a.symbol, (map.get(a.symbol) ?? 0) + Number(a.total || 0)), new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([symbol]) => symbol);

  const visibleTabs = isMarketAsset ? TAB_DEFS : TAB_DEFS.filter((t) => t.id === 'overview');

  // Evolução da posição a partir das operações (mais antiga → mais nova).
  const chartData = (() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let qty = 0;
    let invested = 0;
    return sorted.map((t) => {
      if (t.type === 'buy') {
        qty += t.quantity;
        invested += t.total || t.quantity * t.price;
      } else {
        qty -= t.quantity;
        invested -= t.quantity * t.price;
      }
      return {
        date: new Date(t.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC'}),
        saldo: Math.round(qty * (price ?? t.price) * 100) / 100,
        investido: Math.round(invested * 100) / 100,
      };
    });
  })();

  const keyIndicators = [
    {label: 'P/L', key: 'priceEarnings', format: (v: number) => `${v.toFixed(1).replace('.', ',')}x`},
    {label: 'P/VP', key: 'priceToBook', format: (v: number) => `${v.toFixed(2).replace('.', ',')}x`},
    {label: 'ROE', key: 'returnOnEquity', format: (v: number) => formatPctPtBr(v, 1)},
    {label: 'Margem líquida', key: 'netMargin', format: (v: number) => formatPctPtBr(v, 1)},
    {label: 'EV/EBITDA', key: 'evEbitda', format: (v: number) => `${v.toFixed(1).replace('.', ',')}x`},
    {label: 'Payout', key: 'payout', format: (v: number) => formatPctPtBr(v, 0)},
  ].map((item) => {
    const view = readIndicator(marketFundamentals, item.key as any);
    return {
      label: item.label,
      value: view.status === 'ok' && view.value != null ? item.format(view.value) : '—',
      note: view.status === 'ok' ? view.source ?? '' : view.status === 'not_applicable' ? 'não se aplica' : 'sem dado',
    };
  });

  const operationsSub = transactions.length
    ? `${transactions.length} ${transactions.length === 1 ? 'operação' : 'operações'}${pricing.avgPrice ? ` · preço médio ${formatCurrency(pricing.avgPrice)}` : ''}`
    : 'Nenhuma operação importada';

  const defaultAnnualReturnRatePercent = Number((getDefaultProjectionAnnualReturn(asset?.type) * 100).toFixed(2));
  const defaultTaxRatePercent = Number((getDefaultProjectionTaxRate(asset?.type) * 100).toFixed(2));
  const projectionResult = calculateAssetProjection({
    currentValue,
    monthlyContribution,
    years: projectionYears,
    annualReturnRate: (annualReturnRatePercent ?? defaultAnnualReturnRatePercent) / 100,
    annualInflationRate: annualInflationRatePercent / 100,
    taxRate: (annualTaxRatePercent ?? defaultTaxRatePercent) / 100,
  });
  const estimatedTaxOnProfit = Math.max(0, projectionResult.grossFinalValue - projectionResult.netFinalValue);

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 36, padding: '0 10px', border: '1px solid var(--hair)', borderRadius: 8,
    background: 'var(--surf-3)', fontSize: 12.5, color: 'inherit', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {fontSize: 11, color: 'var(--color-neutral-500)'};

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      {/* Hero */}
      <section style={{position: 'relative', border: '1px solid rgba(152,160,171,0.30)', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(115deg, rgba(123,130,144,0.34) 0%, rgba(76,201,240,0.16) 48%, rgba(var(--rgb-surf-2),0.85) 100%), var(--surf-2)'}}>
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(520px 240px at 88% -20%, rgba(47,214,163,0.20), rgba(47,214,163,0) 70%)', pointerEvents: 'none'}} />
        <div style={{position: 'relative', padding: 22.4, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 22.4, alignItems: 'center'}}>
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: 11.2}}>
              <div style={{width: 40, height: 40, borderRadius: 8, background: 'var(--grad-violet)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: 'var(--sunk)', boxShadow: '0 0 24px rgba(152,160,171,0.40)', flexShrink: 0}}>
                {display.badge}
              </div>
              <div style={{minWidth: 0}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8.4, flexWrap: 'wrap'}}>
                  <span style={{fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em'}}>{display.title}</span>
                  {sectorLabel ? (
                    <span style={{fontSize: 10.5, color: 'var(--color-accent-100)', border: '1px solid rgba(152,160,171,0.45)', borderRadius: 6, padding: '2px 7px', background: 'rgba(152,160,171,0.16)'}}>{sectorLabel}</span>
                  ) : null}
                </div>
                <div style={{fontSize: 12, color: 'var(--color-neutral-400)', marginTop: 3}}>
                  {companyName}{isMarketAsset ? ' · B3' : ''}
                </div>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'flex-end', gap: 16.8, marginTop: 16.8, flexWrap: 'wrap'}}>
              <div>
                <div style={{fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1}}>
                  {price ? formatCurrency(price) : formatCurrency(currentValue)}
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8.4, marginTop: 5.6, fontSize: 12.5}}>
                  {hasChange ? (
                    <>
                      <span style={{fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: changePct >= 0 ? 'var(--pos)' : 'var(--neg)'}}>
                        {formatSignedPctPtBr(changePct, 2)} hoje
                      </span>
                      <span style={{color: 'var(--color-neutral-500)'}}>
                        {Number.isFinite(changeValue) ? `${changeValue >= 0 ? '+' : '−'}${formatCurrency(Math.abs(changeValue))}` : ''}
                        {closeTime ? ` · fech. ${closeTime}` : ''}
                      </span>
                    </>
                  ) : (
                    <span style={{color: 'var(--color-neutral-500)'}}>
                      {price ? (asset.currentPrice ? 'cotação atual' : 'fechamento do relatório da B3') : 'valor da posição'}
                    </span>
                  )}
                </div>
              </div>
              <div style={{display: 'flex', gap: 22.4, paddingLeft: 22.4, borderLeft: '1px solid var(--hair)', flexWrap: 'wrap'}}>
                {heroStats.map((s) => (
                  <div key={s.label}>
                    <div style={{fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-500)'}}>{s.label}</div>
                    <div style={{fontSize: 15, fontWeight: 600, marginTop: 4, fontVariantNumeric: 'tabular-nums', color: s.color}}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{border: '1px solid rgba(var(--rgb-line),0.14)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.62)', backdropFilter: 'blur(8px)', padding: '14px 16.8px'}}>
            <div style={{fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-500)'}}>Sua posição</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8.4, marginTop: 11.2}}>
              {positionRows.map((p) => (
                <div key={p.label} style={{display: 'flex', alignItems: 'baseline', gap: 11.2, fontSize: 12.5}}>
                  <span style={{flex: 1, color: 'var(--color-neutral-500)'}}>{p.label}</span>
                  <span style={{fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: p.color}}>{p.value}</span>
                </div>
              ))}
            </div>
            <div style={{display: 'flex', gap: 8.4, marginTop: 14}}>
              <button
                type="button"
                onClick={() => navigate(`/add-asset?symbol=${encodeURIComponent(asset.symbol)}`)}
                style={{flex: 1, height: 32, borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, cursor: 'pointer'}}>
                Registrar operação
              </button>
              <button
                type="button"
                onClick={() => navigate(`/dividends/${encodeURIComponent(asset.symbol)}`)}
                style={{height: 32, padding: '0 11.2px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-300)', fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer'}}>
                Proventos
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Abas + ver outro ativo */}
      <div style={{display: 'flex', alignItems: 'center', gap: 11.2, flexWrap: 'wrap', borderBottom: '1px solid var(--hair)', paddingBottom: 11.2}}>
        <div role="tablist" style={{display: 'flex', gap: 2.8, padding: 2.8, border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.8)', flexWrap: 'wrap'}}>
          {visibleTabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={activeTab === t.id} onClick={() => setActiveTab(t.id)} style={segStyle(activeTab === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        {otherAssets.length > 0 && (
          <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8.4}}>
            <span style={{fontSize: 11, color: 'var(--color-neutral-600)'}}>ver outro ativo</span>
            <div style={{display: 'flex', gap: 2.8, padding: 2.8, border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.8)'}}>
              {otherAssets.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  onClick={() => {
                    setActiveTab('overview');
                    navigate(`/portfolio/asset/symbol/${encodeURIComponent(symbol)}`);
                  }}
                  style={segStyle(false)}>
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {activeTab === 'overview' && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 16.8, alignItems: 'start'}}>
            <section style={SECTION}>
              <SectionHeader title={`${display.title} · evolução da posição`} subtitle="Valor a mercado vs valor aportado · por operação" />
              <div style={{padding: 16.8}}>
                {chartData.length < 2 ? (
                  <div style={{padding: '40px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--color-neutral-500)'}}>
                    Importe o Extrato de Negociação da B3 para ver a evolução da posição.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="assetSaldoGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2fd6a3" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2fd6a3" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--hair)" vertical={false} />
                      <XAxis dataKey="date" tick={{fontSize: 10.5}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 10.5}} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v, name) => [formatCurrency(Number(v)), name === 'saldo' ? 'Valor a mercado' : 'Valor aportado']} />
                      <Area type="monotone" dataKey="saldo" stroke="#2fd6a3" strokeWidth={2} fill="url(#assetSaldoGrad)" name="saldo" />
                      <Area type="monotone" dataKey="investido" stroke="var(--color-neutral-400)" strokeDasharray="4 3" strokeWidth={1.5} fill="none" name="investido" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section style={SECTION}>
              <SectionHeader
                title="Indicadores-chave"
                subtitle={isMarketAsset ? 'Último balanço disponível · veja todos em Indicadores' : 'Renda fixa não tem indicadores de bolsa'}
              />
              {isMarketAsset ? (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, background: 'var(--hair-soft)'}}>
                  {keyIndicators.map((f) => (
                    <div key={f.label} style={{padding: '11.2px 16.8px', background: 'var(--surf-3)'}}>
                      <div style={{fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)'}}>{f.label}</div>
                      <div style={{fontSize: 15, fontWeight: 600, marginTop: 5.6, fontVariantNumeric: 'tabular-nums'}}>{f.value}</div>
                      <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2}}>{f.note}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{padding: 16.8, fontSize: 12.5, color: 'var(--color-neutral-500)', lineHeight: 1.55}}>
                  O valor desta posição vem da curva informada pela B3 no relatório consolidado.
                </div>
              )}
            </section>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 16.8, alignItems: 'start'}}>
            {isMarketAsset && (
              <section style={{border: '1px solid rgba(152,160,171,0.28)', borderRadius: 8, background: 'linear-gradient(120deg, rgba(var(--rgb-accent-deep),0.48) 0%, rgba(76,201,240,0.10) 60%, rgba(var(--rgb-surf),0.30) 100%)'}}>
                <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', gap: 8.4}}>
                  <i className="ph-fill ph-sparkle" style={{fontSize: 15, color: 'var(--color-accent-200)'}} />
                  <div style={{flex: 1}}>
                    <div style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600}}>Leitura do copiloto sobre esta posição</div>
                    <div style={{fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 2}}>
                      {opinion?.status === 'degraded' ? 'dados parciais do mercado' : 'indicadores e preço do momento'}
                    </div>
                  </div>
                  {opinion?.scoreOverall != null ? (
                    <span style={{fontSize: 10.5, color: 'var(--color-neutral-400)'}}>score {Math.round(opinion.scoreOverall)}</span>
                  ) : null}
                </div>
                <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 11.2}}>
                  {!hasAiInsights ? (
                    <>
                      <div style={{fontSize: 13, color: 'var(--color-neutral-300)', lineHeight: 1.6}}>
                        A leitura do copiloto por ativo faz parte dos planos com IA.
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/subscription')}
                        style={{alignSelf: 'flex-start', height: 30, padding: '0 11.2px', borderRadius: 8, border: '1px solid var(--color-accent-700)', background: 'transparent', color: 'var(--color-accent-200)', fontSize: 11.5, cursor: 'pointer'}}>
                        Ver planos
                      </button>
                    </>
                  ) : loadingOpinion ? (
                    <div style={{fontSize: 12.5, color: 'var(--color-neutral-500)'}}>Analisando {asset.symbol}…</div>
                  ) : opinion ? (
                    <>
                      <div style={{fontSize: 13, color: 'var(--color-neutral-200)', lineHeight: 1.6}}>{opinion.summary}</div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: 8.4, paddingTop: 11.2, borderTop: '1px solid var(--hair-soft)'}}>
                        {opinion.strength ? (
                          <div style={{display: 'flex', gap: 8.4, fontSize: 12.5, color: 'var(--color-neutral-300)', lineHeight: 1.5}}>
                            <i className="ph-fill ph-check-circle" style={{fontSize: 14, marginTop: 1, color: 'var(--pos)'}} />
                            <span>{opinion.strength}</span>
                          </div>
                        ) : null}
                        {opinion.attention ? (
                          <div style={{display: 'flex', gap: 8.4, fontSize: 12.5, color: 'var(--color-neutral-300)', lineHeight: 1.5}}>
                            <i className="ph-fill ph-warning" style={{fontSize: 14, marginTop: 1, color: 'var(--warn)'}} />
                            <span>{opinion.attention}</span>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div style={{fontSize: 12.5, color: 'var(--color-neutral-500)'}}>Não foi possível gerar a leitura agora.</div>
                  )}
                </div>
              </section>
            )}

            <section style={SECTION}>
              <SectionHeader title="Suas operações" subtitle={operationsSub} />
              {transactions.length === 0 ? (
                <div style={{padding: 16.8, fontSize: 12.5, color: 'var(--color-neutral-500)'}}>
                  Importe o Extrato de Negociação da B3 ou registre uma operação.
                </div>
              ) : (
                <DataTable minWidth={460} columns={[{label: 'Data'}, {label: 'Tipo'}, {label: 'Qtd', align: 'right'}, {label: 'Preço', align: 'right'}, {label: 'Total', align: 'right'}]}>
                  {transactions
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((tx, index) => (
                      <tr key={tx._id || `${tx.date}-${index}`} style={{borderTop: '1px solid var(--hair-soft)'}}>
                        <td style={{...TD_STYLE, color: 'var(--color-neutral-400)', fontVariantNumeric: 'tabular-nums'}}>
                          {new Date(tx.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                        </td>
                        <td style={TD_STYLE}>
                          <span style={{padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: tx.type === 'buy' ? 'var(--badge-pos-bg)' : 'var(--badge-neg-bg)', color: tx.type === 'buy' ? 'var(--pos)' : 'var(--neg)'}}>
                            {tx.type === 'buy' ? 'Compra' : 'Venda'}
                          </span>
                        </td>
                        <td style={{...TD_RIGHT, color: 'var(--color-neutral-300)'}}>{Number(tx.quantity).toLocaleString('pt-BR')}</td>
                        <td style={{...TD_RIGHT, color: 'var(--color-neutral-300)'}}>{formatCurrency(tx.price)}</td>
                        <td style={{...TD_RIGHT, fontWeight: 600}}>{formatCurrency(tx.total || tx.price * tx.quantity)}</td>
                      </tr>
                    ))}
                </DataTable>
              )}
            </section>
          </div>

          <PremiumBlur
            locked={!hasAiInsights}
            title="Projeção Premium do Ativo"
            description="Faça upgrade para simular cenários com aportes mensais, inflação e imposto estimado.">
            <section style={SECTION}>
              <SectionHeader title={`Projeção de valor futuro · ${asset.symbol}`} subtitle={`Estimativa para ${projectionYears} anos com aporte mensal ajustável`} />
              <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 16.8}}>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 11.2}}>
                  <label style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                    <span style={labelStyle}>Aporte mensal (R$)</span>
                    <input type="number" min={0} step="50" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value || 0)))} style={inputStyle} />
                  </label>
                  <label style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                    <span style={labelStyle}>Prazo (anos)</span>
                    <input type="number" min={1} max={40} value={projectionYears} onChange={(e) => setProjectionYears(Math.max(1, Number(e.target.value || 1)))} style={inputStyle} />
                  </label>
                  <label style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                    <span style={labelStyle}>Retorno anual (%)</span>
                    <input type="number" min={0} step="0.1" value={annualReturnRatePercent ?? defaultAnnualReturnRatePercent} onChange={(e) => setAnnualReturnRatePercent(Number(e.target.value || defaultAnnualReturnRatePercent))} style={inputStyle} />
                  </label>
                  <label style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                    <span style={labelStyle}>Inflação anual (%)</span>
                    <input type="number" min={0} step="0.1" value={annualInflationRatePercent} onChange={(e) => setAnnualInflationRatePercent(Math.max(0, Number(e.target.value || 0)))} style={inputStyle} />
                  </label>
                  <label style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                    <span style={labelStyle}>IR no ganho (%)</span>
                    <input type="number" min={0} max={30} step="0.5" value={annualTaxRatePercent ?? defaultTaxRatePercent} onChange={(e) => setAnnualTaxRatePercent(Math.max(0, Number(e.target.value || defaultTaxRatePercent)))} style={inputStyle} />
                  </label>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 11.2}}>
                  {[
                    {label: 'Capital total aportado', value: formatCurrency(projectionResult.totalContributed)},
                    {label: 'Valor final estimado (líquido)', value: formatCurrency(projectionResult.netFinalValue), color: 'var(--color-accent-200)'},
                    {label: 'Lucro nominal estimado', value: formatCurrency(projectionResult.nominalProfitAfterTax), color: 'var(--pos)'},
                    {label: 'Valor real (descontando inflação)', value: formatCurrency(projectionResult.realFinalValue)},
                  ].map((tile) => (
                    <div key={tile.label} style={{borderRadius: 8, border: '1px solid var(--hair)', padding: 11.2, background: 'var(--surf-3)'}}>
                      <div style={labelStyle}>{tile.label}</div>
                      <div style={{fontSize: 16, fontWeight: 600, marginTop: 4, fontVariantNumeric: 'tabular-nums', color: tile.color}}>{tile.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize: 12, color: 'var(--color-neutral-400)', lineHeight: 1.55}}>
                  Com aporte de {formatCurrency(monthlyContribution)} por mês, o cenário projeta {formatCurrency(projectionResult.netFinalValue)} em {projectionYears} anos, já com IR estimado de {formatCurrency(estimatedTaxOnProfit)} sobre o ganho. Retorno real anual estimado: {formatPercentage(projectionResult.annualRealRate * 100)}. Simulação educativa, não é recomendação.
                </div>
              </div>
            </section>
          </PremiumBlur>
        </div>
      )}

      {/* Indicadores / Balanço / Resultados / Dividendos / Sobre — mesmos
          componentes de aba de `AssetDetail` (TRA-118). */}
      {activeTab === 'fundamentals' && (
        <FundamentalsTabContent
          fundamentals={marketFundamentals}
          dividendYield={marketDividendYield}
          lastDividend={marketLastDividend}
          isDividendsRestricted={isDividendsRestricted}
        />
      )}
      {activeTab === 'balance' && (
        <BalanceTabContent financial={marketFinancial} isFundamentalRestricted={isFundamentalRestricted} />
      )}
      {activeTab === 'results' && (
        <ResultsTabContent
          financialHistoryData={financialHistoryData}
          cashflowSection={marketCashflowSection}
          price={marketData?.regularMarketPrice ?? price ?? 0}
          sharesOutstanding={Number(marketData?.sharesOutstanding || 0)}
          dividendYield={marketDividendYield}
        />
      )}
      {activeTab === 'dividends' && (
        <DividendsTabContent dividendHistory={marketDividendHistory} isDividendsRestricted={isDividendsRestricted} />
      )}
      {activeTab === 'about' && <AboutTabContent company={marketCompany} />}
    </div>
  );
};

export default MyAssetDetail;
