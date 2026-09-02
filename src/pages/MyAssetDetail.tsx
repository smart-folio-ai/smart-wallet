import {useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  Legend,
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
import {PremiumBlur} from '@/components/ui/premium-blur';
import {useSubscription} from '@/hooks/useSubscription';
import Stock from '@/services/stocks';
import {
  calculateAssetProjection,
  getDefaultProjectionAnnualReturn,
  getDefaultProjectionTaxRate,
} from './asset-projection.utils';
import {DataTable, TD_STYLE, TD_RIGHT} from '@/components/shared';

interface Transaction {
  _id: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  date: string;
  symbol?: string;
}

const tabDefs = [
  {id: 'overview', label: 'Visão Geral'},
  {id: 'movements', label: 'Movimentações'},
  {id: 'charts', label: 'Gráficos'},
];

const MyAssetDetail = () => {
  const {assetId, symbol: symbolParam} = useParams<{assetId?: string; symbol?: string}>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const {hasAiInsights} = useSubscription();

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
  const shouldLoadMarketFinancials = Boolean(
    asset?.symbol &&
      ['stock', 'fii', 'etf'].includes(String(asset?.type || '').toLowerCase()),
  );

  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [projectionYears, setProjectionYears] = useState(5);
  const [annualReturnRatePercent, setAnnualReturnRatePercent] = useState<number | null>(null);
  const [annualInflationRatePercent, setAnnualInflationRatePercent] = useState(4.5);
  const [annualTaxRatePercent, setAnnualTaxRatePercent] = useState<number | null>(null);

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

  const {data: marketSnapshot} = useQuery({
    queryKey: ['asset-market-financials', asset?.symbol],
    queryFn: async () => {
      if (!asset?.symbol) return null;
      const response = await Stock.getNationalStock(asset.symbol, {
        fundamental: true,
        dividends: true,
        range: '5y',
        interval: '1mo',
      });
      return response?.results?.[0] ?? null;
    },
    enabled: shouldLoadMarketFinancials,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh'}}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{width:40, height:40, borderRadius:'50%', border:'3px solid var(--surf-3)', borderTopColor:'var(--ac)', animation:'spin 0.8s linear infinite'}} />
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:16}}>
        <h1 style={{fontSize:24, fontWeight:700}}>Ativo não encontrado</h1>
        <button
          type="button"
          onClick={() => navigate('/portfolio')}
          style={{display:'flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:8, border:'1px solid var(--hair)', background:'var(--surf-3)', cursor:'pointer', fontSize:14}}>
          <i className="ph-fill ph-arrow-left" style={{fontSize:16}} />
          Voltar ao Portfólio
        </button>
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
      : asset.type === 'etf'
      ? 'ETF'
      : asset.type === 'crypto'
      ? 'Cripto'
      : asset.type === 'fund'
      ? 'Renda Fixa'
      : 'Outro';

  const defaultAnnualReturnRatePercent = Number(
    (getDefaultProjectionAnnualReturn(asset?.type) * 100).toFixed(2),
  );
  const defaultTaxRatePercent = Number(
    (getDefaultProjectionTaxRate(asset?.type) * 100).toFixed(2),
  );
  const annualReturnRate = (annualReturnRatePercent ?? defaultAnnualReturnRatePercent) / 100;
  const annualTaxRate = (annualTaxRatePercent ?? defaultTaxRatePercent) / 100;
  const annualInflationRate = annualInflationRatePercent / 100;
  const projectionResult = calculateAssetProjection({
    currentValue,
    monthlyContribution,
    years: projectionYears,
    annualReturnRate,
    annualInflationRate,
    taxRate: annualTaxRate,
  });
  const estimatedTaxOnProfit = Math.max(
    0,
    projectionResult.grossFinalValue - projectionResult.netFinalValue,
  );
  const financialHistoryData = Array.isArray((marketSnapshot as any)?.financialHistory)
    ? [...(marketSnapshot as any).financialHistory]
        .filter((row: any) => typeof row?.year === 'number')
        .sort((a: any, b: any) => a.year - b.year)
        .map((row: any) => ({
          year: row.year,
          revenue: Number(row.revenue || 0),
          profit: Number(row.netIncome || 0),
        }))
    : [];

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 38,
    paddingLeft: 10,
    paddingRight: 10,
    border: '1px solid var(--hair)',
    borderRadius: 7,
    background: 'var(--surf-3)',
    fontSize: 13,
    color: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-neutral-500)',
  };

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--hair)',
    borderRadius: 12,
    background: 'var(--nk-card)',
    padding: 24,
  };

  const cardTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-heading)',
    fontSize: 15,
    fontWeight: 600,
  };

  return (
    <div style={{minHeight:'100vh', background:'var(--surf-1)'}}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{maxWidth:1280, margin:'0 auto', padding:'24px 16px'}}>

        {/* Header */}
        <div style={{display:'flex', alignItems:'center', gap:16, marginBottom:24, flexWrap:'wrap'}}>
          <button
            type="button"
            onClick={() => navigate('/portfolio')}
            style={{display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'1px solid var(--hair)', background:'transparent', cursor:'pointer', fontSize:13, color:'inherit'}}>
            <i className="ph-fill ph-arrow-left" style={{fontSize:15}} />
            Portfólio
          </button>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <h1 style={{fontSize:28, fontWeight:700, margin:0}}>{displaySymbol}</h1>
                <span style={{padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:500, background:'var(--surf-3)', color:'var(--color-neutral-400)'}}>
                  {typeLabel}
                </span>
              </div>
              {secondaryName ? (
                <p style={{color:'var(--color-neutral-500)', margin:0, fontSize:13}}>{secondaryName}</p>
              ) : (
                <p style={{color:'var(--color-neutral-500)', margin:0, fontSize:13}}>{asset.symbol}</p>
              )}
            </div>
          </div>
          <div style={{marginLeft:'auto'}}>
            <button
              type="button"
              onClick={() => navigate(`/asset/${asset.symbol}`)}
              style={{display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, border:'1px solid var(--hair)', background:'transparent', cursor:'pointer', fontSize:13, color:'inherit'}}>
              <i className="ph-fill ph-link-simple" style={{fontSize:15}} />
              Ver no Mercado
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, marginBottom:24}}>
          {/* Valor Investido */}
          <div style={{...cardStyle, padding:16}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4}}>
              <span style={{fontSize:11, color:'var(--color-neutral-500)'}}>Valor Investido</span>
              <i className="ph-fill ph-wallet" style={{fontSize:15, color:'var(--color-neutral-500)'}} />
            </div>
            <p style={{fontSize:20, fontWeight:700, margin:0}}>{formatCurrency(investedValue)}</p>
            <p style={{fontSize:11, color:'var(--color-neutral-500)', margin:0}}>
              PM: {formatCurrency(asset.avgPrice || asset.purchasePrice || 0)}
            </p>
          </div>

          {/* Saldo Bruto */}
          <div style={{...cardStyle, padding:16}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4}}>
              <span style={{fontSize:11, color:'var(--color-neutral-500)'}}>Saldo Bruto</span>
              <i className="ph-fill ph-currency-dollar" style={{fontSize:15, color:'var(--color-neutral-500)'}} />
            </div>
            <p style={{fontSize:20, fontWeight:700, margin:0}}>{formatCurrency(currentValue)}</p>
            <p style={{fontSize:11, color:'var(--color-neutral-500)', margin:0}}>
              {formatCurrency(asset.price)} / un
            </p>
          </div>

          {/* Quantidade */}
          <div style={{...cardStyle, padding:16}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4}}>
              <span style={{fontSize:11, color:'var(--color-neutral-500)'}}>Quantidade</span>
              <i className="ph-fill ph-chart-bar" style={{fontSize:15, color:'var(--color-neutral-500)'}} />
            </div>
            <p style={{fontSize:20, fontWeight:700, margin:0}}>
              {(asset.quantity || asset.amount || 0).toLocaleString('pt-BR')}
            </p>
            <p style={{fontSize:11, color:'var(--color-neutral-500)', margin:0}}>unidades</p>
          </div>

          {/* P&L */}
          <div style={{...cardStyle, padding:16}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4}}>
              <span style={{fontSize:11, color:'var(--color-neutral-500)'}}>P&L (sem proventos)</span>
              {isPositive ? (
                <i className="ph-fill ph-trend-up" style={{fontSize:15, color:'var(--pos)'}} />
              ) : (
                <i className="ph-fill ph-trend-down" style={{fontSize:15, color:'var(--neg)'}} />
              )}
            </div>
            <p style={{fontSize:20, fontWeight:700, margin:0, color: isPositive ? 'var(--pos)' : 'var(--neg)'}}>
              {formatCurrency(profitLoss)}
            </p>
            <p style={{fontSize:11, margin:0, color: isPositive ? 'var(--pos)' : 'var(--neg)'}}>
              {formatPercentage(profitLossPercent)}
            </p>
          </div>
        </div>

        {/* Pill Tabs */}
        <div style={{display:'flex', gap:4, background:'var(--surf-3)', borderRadius:10, padding:4, flexWrap:'wrap', marginBottom:16}}>
          {tabDefs.map(({id, label}) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              style={{padding:'7px 16px', borderRadius:7, border:'none', cursor:'pointer', fontSize:13, fontWeight:500,
                background: activeTab === id ? 'var(--ac)' : 'transparent',
                color: activeTab === id ? '#fff' : 'var(--color-neutral-400)'}}>
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div style={{display:'flex', flexDirection:'column', gap:24}}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:24}}>
              {/* Posição na Carteira */}
              <div style={cardStyle}>
                <span style={cardTitleStyle}>Posição na Carteira</span>
                <p style={{fontSize:12, color:'var(--color-neutral-500)', margin:'4px 0 16px'}}>Métricas pessoais do investidor</p>
                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {[
                    {label: 'Preço Médio', value: formatCurrency(asset.avgPrice || asset.purchasePrice || 0)},
                    {label: 'Preço Atual', value: formatCurrency(asset.price || 0)},
                    {label: 'Quantidade', value: `${(asset.quantity || asset.amount || 0).toLocaleString('pt-BR')} un`},
                    {label: 'Valor Investido', value: formatCurrency(investedValue)},
                    {label: 'Saldo Bruto', value: formatCurrency(currentValue)},
                    {label: 'Alocação', value: `${(asset.allocation || 0).toFixed(1)}%`},
                  ].map(({label, value}) => (
                    <div key={label} style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--hair-soft)', paddingBottom:8}}>
                      <span style={{color:'var(--color-neutral-500)', fontSize:13}}>{label}</span>
                      <span style={{fontWeight:500, fontSize:13}}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resultado */}
              <div style={cardStyle}>
                <span style={cardTitleStyle}>Resultado</span>
                <p style={{fontSize:12, color:'var(--color-neutral-500)', margin:'4px 0 16px'}}>Performance do investimento</p>
                <div style={{textAlign:'center', padding:24, background:'var(--surf-3)', borderRadius:8, marginBottom:16}}>
                  <p style={{fontSize:12, color:'var(--color-neutral-500)', marginBottom:4}}>P&L Total (sem proventos)</p>
                  <p style={{fontSize:28, fontWeight:700, color: isPositive ? 'var(--pos)' : 'var(--neg)', margin:0}}>
                    {formatCurrency(profitLoss)}
                  </p>
                  <p style={{fontSize:13, marginTop:4, display:'flex', alignItems:'center', justifyContent:'center', gap:4, color: isPositive ? 'var(--pos)' : 'var(--neg)'}}>
                    {isPositive ? (
                      <i className="ph-fill ph-trend-up" style={{fontSize:14}} />
                    ) : (
                      <i className="ph-fill ph-trend-down" style={{fontSize:14}} />
                    )}
                    {formatPercentage(profitLossPercent)}
                  </p>
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:12}}>
                  {(asset.dividendYield) && (
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{color:'var(--color-neutral-500)', fontSize:13}}>Dividend Yield</span>
                      <span style={{fontWeight:500, fontSize:13, color:'var(--pos)'}}>
                        {formatPercentage(asset.dividendYield)}
                      </span>
                    </div>
                  )}

                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{color:'var(--color-neutral-500)', fontSize:13}}>Variação 24h</span>
                    <span style={{fontWeight:500, fontSize:13, color: (asset.change24h || 0) >= 0 ? 'var(--pos)' : 'var(--neg)'}}>
                      {formatPercentage(asset.change24h || 0)}
                    </span>
                  </div>

                  {asset.targetPrice && (
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={{color:'var(--color-neutral-500)', fontSize:13, display:'flex', alignItems:'center', gap:4}}>
                        <i className="ph-fill ph-target" style={{fontSize:13}} />
                        Preço Alvo
                      </span>
                      <span style={{fontWeight:500, fontSize:13}}>
                        {formatCurrency(asset.targetPrice)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Premium Projection */}
            <PremiumBlur
              locked={!hasAiInsights}
              className="mt-6"
              title="Projeção Premium do Ativo"
              description="Faça upgrade para simular cenários com aportes mensais, inflação e imposto estimado.">
              <div style={cardStyle}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                  <i className="ph-fill ph-sparkle" style={{fontSize:18, color:'var(--ac)'}} />
                  <span style={cardTitleStyle}>
                    Projeção de Valor Futuro ({asset.symbol})
                  </span>
                </div>
                <p style={{fontSize:12, color:'var(--color-neutral-500)', margin:'4px 0 20px'}}>
                  Estimativa para {projectionYears} anos com aporte mensal ajustável. Aplicável para Ações, FIIs, ETFs, Cripto e outros ativos.
                </p>

                {/* Projection inputs */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:20}}>
                  <div style={{display:'flex', flexDirection:'column', gap:4}}>
                    <label style={labelStyle}>Aporte mensal (R$)</label>
                    <input
                      type="number"
                      min={0}
                      step="50"
                      value={monthlyContribution}
                      onChange={(event) =>
                        setMonthlyContribution(
                          Math.max(0, Number(event.target.value || 0)),
                        )
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:4}}>
                    <label style={labelStyle}>Prazo (anos)</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={projectionYears}
                      onChange={(event) =>
                        setProjectionYears(
                          Math.max(1, Number(event.target.value || 1)),
                        )
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:4}}>
                    <label style={labelStyle}>Retorno anual (%)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={annualReturnRatePercent ?? defaultAnnualReturnRatePercent}
                      onChange={(event) =>
                        setAnnualReturnRatePercent(
                          Number(event.target.value || defaultAnnualReturnRatePercent),
                        )
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:4}}>
                    <label style={labelStyle}>Inflação anual (%)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={annualInflationRatePercent}
                      onChange={(event) =>
                        setAnnualInflationRatePercent(
                          Math.max(0, Number(event.target.value || 0)),
                        )
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:4}}>
                    <label style={labelStyle}>IR no ganho (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      step="0.5"
                      value={annualTaxRatePercent ?? defaultTaxRatePercent}
                      onChange={(event) =>
                        setAnnualTaxRatePercent(
                          Math.max(0, Number(event.target.value || defaultTaxRatePercent)),
                        )
                      }
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Projection summary tiles */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:20}}>
                  <div style={{borderRadius:8, border:'1px solid var(--hair)', padding:12, background:'var(--surf-3)'}}>
                    <p style={{fontSize:11, color:'var(--color-neutral-500)', margin:'0 0 4px'}}>Capital total aportado</p>
                    <p style={{fontSize:17, fontWeight:700, margin:0}}>{formatCurrency(projectionResult.totalContributed)}</p>
                  </div>
                  <div style={{borderRadius:8, border:'1px solid var(--hair)', padding:12, background:'var(--surf-3)'}}>
                    <p style={{fontSize:11, color:'var(--color-neutral-500)', margin:'0 0 4px'}}>Valor final estimado (líquido)</p>
                    <p style={{fontSize:17, fontWeight:700, margin:0, color:'var(--ac)'}}>{formatCurrency(projectionResult.netFinalValue)}</p>
                  </div>
                  <div style={{borderRadius:8, border:'1px solid var(--hair)', padding:12, background:'var(--surf-3)'}}>
                    <p style={{fontSize:11, color:'var(--color-neutral-500)', margin:'0 0 4px'}}>Lucro nominal estimado</p>
                    <p style={{fontSize:17, fontWeight:700, margin:0, color:'var(--pos)'}}>
                      {formatCurrency(projectionResult.nominalProfitAfterTax)}
                    </p>
                  </div>
                  <div style={{borderRadius:8, border:'1px solid var(--hair)', padding:12, background:'var(--surf-3)'}}>
                    <p style={{fontSize:11, color:'var(--color-neutral-500)', margin:'0 0 4px'}}>Valor real (descontando inflação)</p>
                    <p style={{fontSize:17, fontWeight:700, margin:0}}>{formatCurrency(projectionResult.realFinalValue)}</p>
                  </div>
                </div>

                {/* Projection note */}
                <div style={{borderRadius:8, border:'1px solid var(--hair)', background:'rgba(145,132,217,0.15)', padding:12}}>
                  <p style={{fontSize:11, fontWeight:600, color:'var(--color-neutral-500)', display:'flex', alignItems:'center', gap:6, margin:'0 0 6px'}}>
                    <i className="ph-fill ph-calculator" style={{fontSize:14, color:'var(--ac)'}} />
                    Leitura da estimativa
                  </p>
                  <p style={{fontSize:13, margin:'0 0 4px'}}>
                    Com aporte de <strong>{formatCurrency(monthlyContribution)}</strong> por mês, o cenário atual projeta
                    <strong> {formatCurrency(projectionResult.netFinalValue)}</strong> em {projectionYears} anos para {asset.symbol}, já com
                    IR estimado de <strong>{formatCurrency(estimatedTaxOnProfit)}</strong> sobre o ganho.
                  </p>
                  <p style={{fontSize:11, color:'var(--color-neutral-500)', margin:0}}>
                    Retorno real anual estimado: {formatPercentage(projectionResult.annualRealRate * 100)}.
                    Esta simulação é educativa e não constitui recomendação.
                  </p>
                </div>
              </div>
            </PremiumBlur>
          </div>
        )}

        {/* Movements */}
        {activeTab === 'movements' && (
          <div style={cardStyle}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
              <i className="ph-fill ph-receipt" style={{fontSize:18}} />
              <span style={cardTitleStyle}>Histórico de Movimentações</span>
            </div>
            <p style={{fontSize:12, color:'var(--color-neutral-500)', margin:'4px 0 20px'}}>
              Todas as compras e vendas deste ativo
            </p>
            {transactions.length === 0 ? (
              <div style={{textAlign:'center', padding:'32px 0', color:'var(--color-neutral-500)'}}>
                <i className="ph-fill ph-receipt" style={{fontSize:32, opacity:0.3, display:'block', marginBottom:12}} />
                <p style={{margin:'0 0 4px'}}>Nenhuma movimentação registrada</p>
                <p style={{fontSize:11, margin:'0 0 16px'}}>
                  As transações aparecerão aqui conforme forem adicionadas
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/add-asset')}
                  style={{display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8, border:'1px solid var(--hair)', background:'transparent', cursor:'pointer', fontSize:13, color:'var(--ac)'}}>
                  <i className="ph-fill ph-plus" style={{fontSize:14}} />
                  Adicionar transação
                </button>
              </div>
            ) : (
              <DataTable columns={[{label:'Data'},{label:'Tipo'},{label:'Qtd',align:'right'},{label:'Preço',align:'right'},{label:'Total',align:'right'}]}>
                {transactions.map((tx) => (
                  <tr key={tx._id || String(tx.date)} style={{borderTop:'1px solid var(--hair-soft)'}}>
                    <td style={TD_STYLE}>{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                    <td style={TD_STYLE}>
                      <span style={{padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:500,
                        background: tx.type === 'buy' ? 'var(--badge-pos-bg)' : 'var(--badge-neg-bg)',
                        color: tx.type === 'buy' ? 'var(--pos)' : 'var(--neg)'}}>
                        {tx.type === 'buy' ? 'Compra' : 'Venda'}
                      </span>
                    </td>
                    <td style={TD_RIGHT}>{tx.quantity}</td>
                    <td style={TD_RIGHT}>{formatCurrency(tx.price)}</td>
                    <td style={{...TD_RIGHT, fontWeight:600}}>
                      {tx.type === 'buy' ? '-' : '+'}
                      {formatCurrency(tx.total || tx.price * tx.quantity)}
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        )}

        {/* Charts */}
        {activeTab === 'charts' && (
          <div style={{display:'flex', flexDirection:'column', gap:24}}>
            {/* Financial History Bar Chart */}
            <div style={cardStyle}>
              <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16}}>
                <div>
                  <span style={cardTitleStyle}>Histórico de Lucro e Receita</span>
                  <p style={{fontSize:12, color:'var(--color-neutral-500)', margin:'4px 0 0'}}>
                    Série anual de fundamentos para ativos com demonstrativos financeiros.
                  </p>
                </div>
                <span style={{padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:500, border:'1px solid var(--hair)', color:'var(--color-neutral-400)'}}>
                  até 5 anos
                </span>
              </div>
              {financialHistoryData.length < 2 ? (
                <div style={{textAlign:'center', padding:'32px 0', color:'var(--color-neutral-500)'}}>
                  <i className="ph-fill ph-chart-bar" style={{fontSize:32, opacity:0.3, display:'block', marginBottom:12}} />
                  <p style={{margin:'0 0 4px'}}>Dados fundamentalistas insuficientes para este ativo</p>
                  <p style={{fontSize:11, margin:0}}>
                    Para Ações/FIIs/ETFs, os dados aparecem quando disponíveis no provedor.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <RechartsBarChart data={financialHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="var(--hair)" />
                    <XAxis dataKey="year" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{fontSize: 11}}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `R$ ${(Number(v) / 1e9).toFixed(1)}B`}
                    />
                    <Tooltip
                      formatter={(v: any, key: any) => [
                        formatCurrency(Number(v || 0)),
                        key === 'profit' ? 'Lucro Líquido' : 'Receita Líquida',
                      ]}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="revenue" name="Receita Líquida" fill="#9184d9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Lucro Líquido" fill="#2fd6a3" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Area Chart */}
            <div style={cardStyle}>
              <span style={cardTitleStyle}>Saldo Bruto vs Valor Investido</span>
              <p style={{fontSize:12, color:'var(--color-neutral-500)', margin:'4px 0 16px'}}>Evolução ao longo do tempo</p>
              {chartData.length < 2 ? (
                <div style={{textAlign:'center', padding:'32px 0', color:'var(--color-neutral-500)'}}>
                  <i className="ph-fill ph-chart-bar" style={{fontSize:32, opacity:0.3, display:'block', marginBottom:12}} />
                  <p style={{margin:'0 0 4px'}}>Dados insuficientes para gerar o gráfico</p>
                  <p style={{fontSize:11, margin:0}}>
                    Adicione transações para visualizar a evolução
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2fd6a3" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2fd6a3" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="investGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9184d9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#9184d9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--hair)" />
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
                      stroke="#2fd6a3"
                      strokeWidth={2}
                      fill="url(#saldoGrad)"
                      name="saldo"
                    />
                    <Area
                      type="monotone"
                      dataKey="investido"
                      stroke="#9184d9"
                      strokeWidth={2}
                      fill="url(#investGrad)"
                      name="investido"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Line Chart - Quantidade */}
            <div style={cardStyle}>
              <span style={cardTitleStyle}>Evolução da Quantidade</span>
              <p style={{fontSize:12, color:'var(--color-neutral-500)', margin:'4px 0 16px'}}>
                Quantidade de ativos ao longo do tempo
              </p>
              {chartData.length < 2 ? (
                <div style={{textAlign:'center', padding:'32px 0', color:'var(--color-neutral-500)'}}>
                  <p style={{fontSize:13, margin:0}}>Dados insuficientes</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--hair)" />
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
                      stroke="#9184d9"
                      strokeWidth={2}
                      dot={false}
                      name="quantidade"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyAssetDetail;
