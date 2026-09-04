import {useMemo, useState} from 'react';
import * as XLSX from 'xlsx';
import {useLocation, useNavigate} from 'react-router-dom';
import {useToast} from '@/hooks/use-toast';
import {useQueryClient, useMutation} from '@tanstack/react-query';
import {Loader2, Trash2} from '@/components/ui/icons';
import {Button} from '@/components/ui/button';
import {B3ImportGuideModal} from '@/components/portfolio/B3ImportGuideModal';
import {AssetDetailModal} from '@/components/portfolio/AssetDetailModal';
import {ConfirmDialog} from '@/components/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types and Services
import {Asset, SortConfig} from '@/types/portfolio';
import portfolioService from '@/services/portfolio';
import {useQuery} from '@tanstack/react-query';
import {useSubscription} from '@/hooks/useSubscription';
import {
  buildAiCacheSignature,
  getAiPlanFromPlanName,
  getOrCreateAiAnalysis,
} from '@/services/ai/trakkerAi';

// Nocturne shared components
import {
  SectionHeader,
  DataTable,
  TD_STYLE,
  TD_RIGHT,
  MarketDataStaleBanner,
} from '@/components/shared';
import {useAdaptiveLevel} from '@/contexts/AdaptiveLevelContext';
import {
  deriveMarketDataStatus,
  hasFreshQuote,
} from '@/pages/dashboard-summary.utils';

// ── Exposure + Risk helpers ────────────────────────────────────────────────
const DEFAULT_TARGETS: Record<string, number> = {
  stock: 40, fii: 20, fund: 25, etf: 10, crypto: 5,
};
const TYPE_LABEL: Record<string, string> = {
  stock: 'Ações', fii: 'FIIs', fund: 'Renda Fixa', etf: 'ETFs', crypto: 'Cripto', other: 'Outros',
};

// Mesma paleta usada no donut/legenda de alocação do dashboard (ver ALLOCATION_COLORS em Index.tsx),
// estendida para as classes adicionais exibidas aqui (fund/etf não existem como fatia própria lá).
const CLASS_COLORS: Record<string, string> = {
  stock: 'hsl(var(--chart-2))',
  crypto: 'hsl(var(--chart-1))',
  fii: 'hsl(var(--chart-4))',
  fund: 'hsl(var(--chart-3))',
  etf: 'hsl(var(--chart-5))',
  other: 'hsl(var(--chart-3))',
};

export type ExposureGroupBy = 'class' | 'sector' | 'account';

function pickGroupKey(a: Asset, groupBy: ExposureGroupBy): string {
  if (groupBy === 'sector') return String(a.sector || '').trim() || 'Sem setor';
  if (groupBy === 'account') return a.account ?? 'Sem conta';
  return a.type;
}

function computeExposure(
  assets: Asset[],
  totalValue: number,
  groupBy: ExposureGroupBy = 'class',
) {
  const acc: Record<string, number> = {};
  for (const a of assets) {
    const k = pickGroupKey(a, groupBy);
    acc[k] = (acc[k] || 0) + a.value;
  }
  return Object.entries(acc)
    .map(([key, value]) => {
      const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
      const target = groupBy === 'class' ? (DEFAULT_TARGETS[key] ?? 0) : 0;
      return {
        type: key,
        label: groupBy === 'class' ? (TYPE_LABEL[key] || key) : key,
        value,
        pct,
        dev: pct - target,
        target,
        color: CLASS_COLORS[key] || 'var(--color-neutral-400)',
      };
    })
    .sort((a, b) => b.value - a.value);
}

const RISK_MUL: Record<string, number> = {
  stock: 1.5, crypto: 2.5, fii: 1.0, fund: 0.5, etf: 0.8, other: 0.3,
};

function computeRiskContribution(assets: Asset[]) {
  const weighted = assets.map((a) => ({
    symbol: a.symbol,
    rw: (a.allocation / 100) * (RISK_MUL[a.type] ?? 1),
    alloc: a.allocation,
  }));
  const totalRisk = weighted.reduce((s, a) => s + a.rw, 0) || 1;
  return weighted
    .map(({symbol, rw, alloc}) => ({symbol, share: (rw / totalRisk) * 100, weight: alloc}))
    .sort((a, b) => b.share - a.share)
    .slice(0, 8);
}

const SIGNAL_STYLE: Record<string, {bg: string; color: string}> = {
  COMPRA: {bg: 'var(--badge-pos-bg)', color: 'var(--pos)'},
  NEUTRO: {bg: 'var(--badge-warn-bg)', color: 'var(--warn)'},
  VENDA: {bg: 'var(--badge-neg-bg)', color: 'var(--neg)'},
};

function SignalBadge({signal}: {signal?: string}) {
  if (!signal) return <span style={{color: 'var(--color-neutral-500)'}}>—</span>;
  const s = SIGNAL_STYLE[signal] ?? {bg: 'var(--surf-3)', color: 'var(--color-neutral-400)'};
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 7px',
      borderRadius: 10,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      background: s.bg,
      color: s.color,
    }}>
      {signal}
    </span>
  );
}

// ── ColumnConfigurator ─────────────────────────────────────────────────────
function ColumnConfigurator({visibleCols, onToggle}: {visibleCols: Record<string, boolean>; onToggle: (col: string) => void}) {
  const [open, setOpen] = useState(false);
  const cols = ['class', 'account', 'qty', 'avgPrice', 'price', 'value', 'pnl', 'dy', 'weight', 'beta', 'signal'];
  const labels: Record<string, string> = {
    class: 'Classe',
    account: 'Conta',
    qty: 'Qtd',
    avgPrice: 'Preço Médio',
    price: 'Cotação',
    value: 'Valor',
    pnl: 'P&L R$',
    dy: 'DY',
    weight: 'Peso',
    beta: 'Beta',
    signal: 'Sinal',
  };
  return (
    <div style={{position: 'relative'}}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          height: 30,
          padding: '0 11.2px',
          border: '1px solid var(--hair)',
          borderRadius: 8,
          background: 'transparent',
          color: 'var(--color-neutral-400)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5.6,
        }}>
        <i className="ph ph-sliders" style={{fontSize: 14}} /> Colunas
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 36,
            zIndex: 50,
            width: 180,
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'var(--surf-4)',
            boxShadow: 'var(--shadow-lg)',
            padding: '8px 0',
          }}>
          {cols.map((c) => (
            <label
              key={c}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8.4,
                padding: '6px 14px',
                fontSize: 12.5,
                cursor: 'pointer',
              }}>
              <input
                type="checkbox"
                checked={visibleCols[c] ?? true}
                onChange={() => onToggle(c)}
                style={{accentColor: 'var(--ac)'}}
              />
              {labels[c]}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
const formatCurrency = (v: number) =>
  v.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

// Value getters for XLSX export — mirrors the columns rendered in the table body
const COLUMN_VALUE_GETTERS: Record<string, (asset: Asset) => string | number> = {
  symbol: (a) => a.symbol,
  class: (a) => a.type,
  account: (a) => a.account ?? '—',
  qty: (a) => a.amount,
  avgPrice: (a) => a.avgPrice ?? a.price,
  // Sem cotação viva do feed, exportar 0 ou o próprio avgPrice esconde o
  // problema — melhor deixar em branco para o usuário perceber (TRA-92).
  price: (a) => (hasFreshQuote(a) ? (a.currentPrice as number) : ''),
  value: (a) => a.value,
  pnl: (a) => (a.profitLoss == null ? '' : a.profitLoss),
  dy: (a) => a.dividendYield ?? '',
  weight: (a) => a.allocation ?? 0,
  beta: (a) => a.beta ?? 0,
  signal: (a) => a.signal ?? '—',
};

// ── Portfolio Page ─────────────────────────────────────────────────────────
const Portfolio = () => {
  const {toast} = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const {planName} = useSubscription();
  const {level} = useAdaptiveLevel();

  // ── Existing state (untouched) ────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [imbalanceFilter, setImbalanceFilter] = useState('all');
  const [isUploadingB3, setIsUploadingB3] = useState(false);
  const [b3GuideOpen, setB3GuideOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({key: '', direction: 'asc'});
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // ── New Nocturne UI state ─────────────────────────────────────────────
  const [exposureGroupBy, setExposureGroupBy] = useState<ExposureGroupBy>('class');
  const [includeFixedIncome, setIncludeFixedIncome] = useState(true);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    class: true,
    account: true,
    qty: true,
    avgPrice: true,
    price: true,
    value: true,
    pnl: true,
    dy: true,
    weight: true,
    beta: false,
    signal: true,
  });
  const toggleCol = (col: string) =>
    setVisibleCols((prev) => ({...prev, [col]: !(prev[col] ?? true)}));

  // ── Queries (untouched) ───────────────────────────────────────────────
  const {data: portfolios = []} = useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const data = await portfolioService.getPortfolios();
      return Array.isArray(data) ? data : [];
    },
  });

  const {
    data: apiAssets = [],
    isLoading: loading,
    dataUpdatedAt: assetsUpdatedAt,
  } = useQuery({
    queryKey: ['portfolioAssets'],
    queryFn: async () => {
      const data = await portfolioService.getAssets();
      return Array.isArray(data) ? data : [];
    },
  });

  const {
    data: portfolioHistory = [],
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useQuery({
    queryKey: ['portfolioHistory', selectedPortfolioId],
    queryFn: async () => {
      if (selectedPortfolioId === 'all') return [];
      return portfolioService.getPortfolioHistory(selectedPortfolioId);
    },
    enabled: selectedPortfolioId !== 'all',
  });

  const displayApiAssets =
    selectedPortfolioId === 'all'
      ? apiAssets
      : apiAssets.filter((a: any) => a.portfolioId === selectedPortfolioId);

  const aiPlan = getAiPlanFromPlanName(planName);
  const aiSignature = buildAiCacheSignature(displayApiAssets);

  const {data: portfolioAiAnalysis} = useQuery({
    queryKey: ['portfolio-ai-analysis', aiPlan, aiSignature],
    enabled: displayApiAssets.length > 0,
    staleTime: 30 * 60 * 1000,
    retry: false,
    queryFn: async () =>
      getOrCreateAiAnalysis({rawAssets: displayApiAssets, plan: aiPlan}),
  });

  const totalApiValue = displayApiAssets.reduce(
    (sum: number, asset: any) => sum + (asset.total || 0),
    0,
  );

  // Sem cotação viva, P&L e sinal viram chute (voltavam "R$ 0,00" ou "NEUTRO"
  // como se fosse informação real — TRA-92). Preferimos deixar como
  // desconhecido e sinalizar via banner.
  const assets: Asset[] = displayApiAssets.map((a: any) => {
    const fresh = hasFreshQuote(a);
    const avg = a.avgPrice ?? a.price;
    const pnlPct =
      fresh && avg > 0
        ? ((a.currentPrice - avg) / avg) * 100
        : null;
    const pnlValue =
      fresh ? (a.currentPrice - avg) * (a.quantity ?? 0) : null;
    const dy = a.indicators?.dividendYield ?? 0;

    return {
      _id: a.id || a._id,
      symbol: a.symbol,
      name: a.name || a.symbol,
      price: a.price,
      currentPrice: a.currentPrice ?? undefined,
      change24h: a.change24h ?? 0,
      amount: a.quantity,
      value: a.total,
      allocation:
        totalApiValue > 0
          ? Number(((a.total / totalApiValue) * 100).toFixed(2))
          : 0,
      type: a.type,
      sector: a.sector ?? undefined,
      avgPrice: avg,
      purchasePrice: avg,
      profitLoss: pnlValue as number | undefined,
      profitLossPercentage: pnlPct as number | undefined,
      dividendYield: fresh ? dy : undefined,
      lastDividend: 0,
      dividendHistory: a.dividendHistory ?? undefined,
      beta: a.indicators?.beta ?? undefined,
      // Sem cotação viva não dá para decidir COMPRA/VENDA — o "NEUTRO"
      // padrão iludia o usuário.
      signal: (() => {
        if (pnlPct === null) return undefined;
        if (pnlPct > 5 || dy > 5) return 'COMPRA';
        if (pnlPct < -5) return 'VENDA';
        return 'NEUTRO';
      })(),
      account: a.portfolio?.name ?? undefined,
    };
  });

  const availableSectors = useMemo(
    () =>
      Array.from(
        new Set(
          assets
            .map((asset) => String(asset.sector || '').trim())
            .filter((value) => value.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [assets],
  );

  const FIXED_INCOME_TYPES = new Set(['fund', 'other']);

  const filteredAssets = assets
    .filter((asset) => {
      if (!includeFixedIncome && FIXED_INCOME_TYPES.has(asset.type)) return false;
      if (
        searchQuery &&
        !asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (sectorFilter !== 'all' && String(asset.sector || '') !== sectorFilter)
        return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue === undefined || bValue === undefined) return 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  const marketStatus = useMemo(
    () => deriveMarketDataStatus(displayApiAssets),
    [displayApiAssets],
  );

  const requestSort = (key: keyof Asset) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({key, direction});
  };

  const openAssetDetails = (asset: Asset) => {
    const id = asset._id || (asset as any).id;
    if (id && id !== 'all') {
      navigate(`/portfolio/asset/${id}`);
    } else if (asset.symbol) {
      navigate(`/portfolio/asset/symbol/${asset.symbol}`);
    } else {
      setSelectedAsset(asset);
    }
  };

  const totalDividends = assets
    .filter((asset) => asset.dividendHistory)
    .reduce((sum, asset) => {
      const assetDividends =
        asset.dividendHistory?.reduce((total, div) => total + div.value, 0) || 0;
      return sum + assetDividends * asset.amount;
    }, 0);

  const dividendYield = totalValue > 0 ? (totalDividends / totalValue) * 100 : 0;

  const imbalanceInsights = useMemo(() => {
    const overAllocated = assets.filter((asset) => asset.allocation > 20);
    const highRisk = assets.filter((asset) => Math.abs(asset.change24h || 0) > 5);
    const concentrated = assets.filter((asset) => asset.allocation > 25);
    const temDadoDeOscilacao = displayApiAssets.some(
      (asset: any) =>
        asset?.change24h !== null &&
        asset?.change24h !== undefined &&
        Number(asset.change24h) !== 0,
    );
    return {overAllocated, highRisk, concentrated, temDadoDeOscilacao};
  }, [assets, displayApiAssets]);

  const handleB3Import = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (selectedPortfolioId === 'all') {
      toast({
        title: 'Atenção',
        description: 'Selecione uma carteira específica para importar os ativos.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsUploadingB3(true);
      await portfolioService.importB3Report(selectedPortfolioId, file);
      toast({title: 'Importação concluída', description: 'Os ativos da B3 foram importados com sucesso.'});
      queryClient.invalidateQueries({queryKey: ['portfolioAssets']});
      queryClient.invalidateQueries({queryKey: ['portfolioHistory', selectedPortfolioId]});
      queryClient.invalidateQueries({queryKey: ['portfolios']});
    } catch {
      toast({title: 'Erro na importação', description: 'Ocorreu um problema ao processar o arquivo B3.', variant: 'destructive'});
    } finally {
      setIsUploadingB3(false);
      e.target.value = '';
    }
  };

  const deletePortfolioMutation = useMutation({
    mutationFn: async (portfolioId: string) => portfolioService.deletePortfolio(portfolioId),
    onSuccess: async () => {
      toast({title: 'Carteira removida', description: 'A carteira foi removida com sucesso.'});
      await queryClient.invalidateQueries({queryKey: ['portfolios']});
      await queryClient.invalidateQueries({queryKey: ['portfolioAssets']});
      setSelectedPortfolioId('all');
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({title: 'Erro ao remover carteira', description: 'Não foi possível remover a carteira selecionada.', variant: 'destructive'});
      setDeleteDialogOpen(false);
    },
  });

  const selectedPortfolioName =
    portfolios.find((p: any) => (p.id || p._id) === selectedPortfolioId)?.name ?? 'esta carteira';

  // ── Nocturne derived values ───────────────────────────────────────────
  const exposureRows = useMemo(
    () => computeExposure(filteredAssets, totalValue, exposureGroupBy),
    [filteredAssets, totalValue, exposureGroupBy],
  );
  const groupLabel =
    exposureGroupBy === 'sector' ? 'setor' : exposureGroupBy === 'account' ? 'conta' : 'classe';
  const riskRows = useMemo(() => computeRiskContribution(assets), [assets]);

  const isAdvanced = level === 'avancado';
  const riskSectionTitle = isAdvanced ? 'Contribuição de risco por ativo' : 'Onde está concentrada a carteira';
  const riskSectionSubtitle = isAdvanced
    ? 'Fatia do VaR 95% · janela 252 dias'
    : 'Quanto cada ativo pesa no sobe-e-desce da carteira';

  const riskInsight = useMemo(() => {
    if (riskRows.length < 2) return null;
    const [first, second] = riskRows;
    const shareSum = first.share + second.share;
    const weightSum = first.weight + second.weight;
    return isAdvanced
      ? `Dois nomes (${first.symbol} e ${second.symbol}) respondem por ${shareSum.toFixed(1)}% do VaR com ${weightSum.toFixed(1)}% de peso. A concentração de risco é ${shareSum > weightSum ? 'maior que' : 'próxima de'} a concentração de valor.`
      : `${first.symbol} e ${second.symbol} juntos movem ${shareSum.toFixed(0)}% do sobe-e-desce da sua carteira, mesmo somando só ${weightSum.toFixed(0)}% do valor investido.`;
  }, [riskRows, isAdvanced]);

  // Active columns for DataTable header
  const allColDefs: {
    key: string;
    label: string;
    always?: boolean;
    align?: 'left' | 'right' | 'center';
    tooltip?: {title: string; body: string; formula?: string};
  }[] = [
    {key: 'symbol', label: 'Ativo', always: true},
    {
      key: 'class',
      label: 'Classe',
      tooltip: {
        title: 'Classe do ativo',
        body: 'Ações, FIIs, ETFs, renda fixa, cripto — usado para agrupar a exposição da carteira e comparar com a política.',
      },
    },
    {
      key: 'account',
      label: 'Conta',
      tooltip: {
        title: 'Conta / corretora',
        body: 'Corretora ou banco onde a posição está custodiada. Ajuda a identificar concentração em um único intermediário.',
      },
    },
    {
      key: 'qty',
      label: 'Qtd',
      align: 'right',
      tooltip: {
        title: 'Quantidade',
        body: 'Total de unidades do ativo somando todas as suas contas.',
      },
    },
    {
      key: 'avgPrice',
      label: 'Preço Médio',
      align: 'right',
      tooltip: {
        title: 'Preço médio',
        body: 'Custo médio das compras já ajustado por desdobramentos e proventos.',
        formula: '∑ (preço · qtd) ÷ qtd total',
      },
    },
    {
      key: 'price',
      label: 'Cotação',
      align: 'right',
      tooltip: {
        title: 'Cotação',
        body: 'Último preço fechado na fonte de mercado. Pode ter atraso de até 15 min conforme o ativo.',
      },
    },
    {
      key: 'value',
      label: 'Valor',
      align: 'right',
      tooltip: {
        title: 'Valor de mercado',
        body: 'Posição marcada a mercado no preço atual, na moeda base da carteira.',
        formula: 'qtd · cotação',
      },
    },
    {
      key: 'pnl',
      label: 'P&L R$',
      align: 'right',
      tooltip: {
        title: 'Lucro/prejuízo não realizado',
        body: 'Ganho ou perda em relação ao preço médio, sem considerar imposto ou custos.',
        formula: '(cotação − preço médio) · qtd',
      },
    },
    {
      key: 'dy',
      label: 'DY',
      align: 'right',
      tooltip: {
        title: 'Dividend Yield',
        body: 'Proventos pagos nos últimos 12 meses divididos pelo preço médio da sua posição.',
        formula: 'proventos 12m ÷ preço médio',
      },
    },
    {
      key: 'weight',
      label: 'Peso',
      align: 'right',
      tooltip: {
        title: 'Peso na carteira',
        body: 'Percentual do valor total da carteira que esse ativo representa hoje.',
        formula: 'valor do ativo ÷ valor total',
      },
    },
    {
      key: 'beta',
      label: 'Beta',
      align: 'right',
      tooltip: {
        title: 'Beta vs IBOV',
        body: 'Sensibilidade do ativo ao índice de referência. Acima de 1 amplifica movimentos do índice; abaixo de 1 amortece.',
        formula: 'cov(ativo, ibov) ÷ var(ibov)',
      },
    },
    {
      key: 'signal',
      label: 'Sinal',
      align: 'right',
      tooltip: {
        title: 'Sinal do Trackerr',
        body: 'Leitura combinada de valuation, dividendos e desempenho. Não é recomendação — use como um dos insumos.',
      },
    },
  ];
  const activeColumns = allColDefs
    .filter((c) => c.always || (visibleCols[c.key] ?? true))
    .map(({label, align, tooltip}) => ({label, align, tooltip}));

  const handleExportXlsx = () => {
    const exportColumns = allColDefs.filter((c) => c.always || (visibleCols[c.key] ?? true));
    const rows = filteredAssets.map((asset) => {
      const row: Record<string, string | number> = {};
      exportColumns.forEach((c) => {
        const getValue = COLUMN_VALUE_GETTERS[c.key];
        row[c.label] = getValue ? getValue(asset) : '';
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Posições');
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `posicoes-trackerr-${today}.xlsx`);
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>

      {marketStatus.isStale && (
        <MarketDataStaleBanner
          updatedAt={assetsUpdatedAt || null}
          staleCount={marketStatus.staleCount}
          totalCount={marketStatus.totalCount}
          staleSymbols={marketStatus.staleSymbols}
        />
      )}

      {/* Toolbar: agregação + filtros + meta line + ações da carteira */}
      <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 11.2}}>
        <div style={{display: 'flex', padding: 2.8, gap: 2.8, border: '1px solid var(--hair)', borderRadius: 8}}>
          {(
            [
              {id: 'class', label: 'Classe'},
              {id: 'sector', label: 'Setor'},
              {id: 'account', label: 'Conta'},
            ] as {id: ExposureGroupBy; label: string}[]
          ).map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setExposureGroupBy(g.id)}
              aria-pressed={exposureGroupBy === g.id}
              style={
                exposureGroupBy === g.id
                  ? {height: 26, padding: '0 12px', fontSize: 12, border: 'none', borderRadius: 6, background: 'var(--nk-card)', color: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer'}
                  : {height: 26, padding: '0 12px', fontSize: 12, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'pointer'}
              }>
              {g.label}
            </button>
          ))}
        </div>

        <div style={{display: 'flex', gap: 5.6, flexWrap: 'wrap'}}>
          <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
            <SelectTrigger
              style={{
                height: 26,
                padding: '0 8.4px',
                borderRadius: 6,
                border: '1px solid var(--hair)',
                background: 'transparent',
                fontSize: 11.5,
                color: 'var(--color-neutral-400)',
              }}>
              <i className="ph ph-buildings" style={{fontSize: 12, marginRight: 5}} />
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {portfolios.map((p: any) => (
                <SelectItem key={p.id || p._id} value={p.id || p._id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span style={{display: 'inline-flex', alignItems: 'center', gap: 5.6, height: 26, padding: '0 8.4px', border: '1px solid var(--hair)', borderRadius: 6, fontSize: 11.5, color: 'var(--color-neutral-400)'}}>
            <i className="ph ph-currency-circle-dollar" style={{fontSize: 12}} />
            Moeda: BRL
          </span>
          <button
            type="button"
            onClick={() => setIncludeFixedIncome((v) => !v)}
            aria-pressed={includeFixedIncome}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5.6,
              height: 26,
              padding: '0 8.4px',
              border: '1px solid var(--hair)',
              borderRadius: 6,
              fontSize: 11.5,
              cursor: 'pointer',
              background: includeFixedIncome ? 'rgba(145,132,217,0.12)' : 'transparent',
              color: includeFixedIncome ? 'var(--color-accent-100)' : 'var(--color-neutral-400)',
            }}>
            <i className={`ph ph-${includeFixedIncome ? 'check-circle' : 'circle'}`} style={{fontSize: 12}} />
            Inclui renda fixa
          </button>
        </div>

        <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 11.2}}>
          <span style={{fontSize: 11.5, color: 'var(--color-neutral-500)', fontVariantNumeric: 'tabular-nums'}}>
            {filteredAssets.length} posições · {formatCurrency(totalValue)}
          </span>
          <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Remover carteira?"
            description={
              <>Isso vai remover <span style={{fontWeight: 500}}>{selectedPortfolioName}</span> e todos os ativos importados/manualmente adicionados nela. Essa ação não pode ser desfeita.</>
            }
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={selectedPortfolioId === 'all' || deletePortfolioMutation.isPending}
                style={{height: 26, padding: '0 10px', fontSize: 11.5}}>
                {deletePortfolioMutation.isPending ? (
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1.5" />
                )}
                Remover carteira
              </Button>
            }
            confirmLabel="Remover"
            cancelLabel="Cancelar"
            confirmIcon={<Trash2 className="h-4 w-4 mr-2" />}
            confirmVariant="destructive"
            loading={deletePortfolioMutation.isPending}
            disabled={selectedPortfolioId === 'all'}
            onConfirm={() => {
              if (!selectedPortfolioId || selectedPortfolioId === 'all') return;
              deletePortfolioMutation.mutate(selectedPortfolioId);
            }}
          />
        </div>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{display: 'none'}}
          id="b3-upload"
          onChange={handleB3Import}
          disabled={isUploadingB3}
        />
      </div>

      {/* Grid Exposição + Risco */}
      <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16.8}}>
        {exposureRows.length > 0 && (
          <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
            <SectionHeader
              title={`Exposição por ${groupLabel}`}
              subtitle="Real vs alvo da política de investimento"
              action={
                <span style={{fontSize: 11, color: 'var(--color-neutral-500)'}}>peso · desvio</span>
              }
            />
            <div style={{padding: '14px 16.8px 16.8px', display: 'flex', flexDirection: 'column', gap: 14}}>
              {exposureRows.map((row) => (
                <div key={row.label}>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: 8.4, fontSize: 12.5}}>
                    <span style={{flex: 1, color: 'var(--color-neutral-200)'}}>{row.label}</span>
                    <span style={{color: 'var(--color-neutral-500)', fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(row.value)}</span>
                    <span style={{width: 46, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{row.pct.toFixed(1)}%</span>
                    <span
                      style={{
                        width: 62,
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 11.5,
                        color: row.target === 0
                          ? 'var(--color-neutral-500)'
                          : row.dev > 5
                            ? 'var(--warn)'
                            : row.dev < -5
                              ? 'var(--neg)'
                              : 'var(--pos)',
                      }}>
                      {row.target === 0
                        ? '—'
                        : `${row.dev > 0 ? '+' : ''}${row.dev.toFixed(1)} p.p.`}
                    </span>
                  </div>
                  <div style={{position: 'relative', height: 8, borderRadius: 2, background: 'rgba(var(--rgb-line),0.06)', marginTop: 5.6}}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${Math.min(row.pct, 100)}%`,
                        background: row.color,
                        borderRadius: 2,
                      }}
                    />
                    {row.target > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -2,
                          bottom: -2,
                          left: `${Math.min(row.target, 100)}%`,
                          width: 2,
                          background: 'var(--color-neutral-400)',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
              {exposureGroupBy === 'class' && (
                <div style={{display: 'flex', alignItems: 'center', gap: 8.4, fontSize: 11, color: 'var(--color-neutral-600)', paddingTop: 5.6, borderTop: '1px solid var(--hair-soft)'}}>
                  <span style={{width: 2, height: 12, background: 'var(--color-neutral-400)'}} />
                  <span>marca vertical = alvo definido na sua política</span>
                </div>
              )}
            </div>
          </section>
        )}

      {/* Contribuição de risco por posição */}
      {riskRows.length > 0 && (
        <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
          <SectionHeader title={riskSectionTitle} subtitle={riskSectionSubtitle} />
          <div style={{padding: '0 0 16px'}}>
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{borderBottom: '1px solid var(--hair)'}}>
                    <th style={{padding: '8px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.06em'}}>Ativo</th>
                    <th style={{padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.06em'}}>Risco %</th>
                    <th style={{padding: '8px 12px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.06em'}}>Peso %</th>
                  </tr>
                </thead>
                <tbody>
                  {riskRows.map((row) => (
                    <tr key={row.symbol} style={{borderBottom: '1px solid var(--hair-soft)'}}>
                      <td style={{padding: '10px 20px', fontSize: 13, fontWeight: 600}}>{row.symbol}</td>
                      <td style={{padding: '10px 12px', textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums'}}>
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8}}>
                          <div style={{width: 60, height: 5, borderRadius: 3, background: 'var(--surf-3)', overflow: 'hidden'}}>
                            <div style={{
                              width: `${Math.min(row.share, 100)}%`,
                              height: '100%',
                              background: row.share > 20 ? 'var(--neg)' : row.share > 10 ? 'var(--warn)' : 'var(--pos)',
                              borderRadius: 3,
                            }} />
                          </div>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: row.share > 20 ? 'var(--neg)' : row.share > 10 ? 'var(--warn)' : 'var(--color-neutral-400)',
                            minWidth: 40,
                            textAlign: 'right',
                          }}>
                            {row.share.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td style={{padding: '10px 12px', textAlign: 'right', fontSize: 13, color: 'var(--color-neutral-500)', fontVariantNumeric: 'tabular-nums'}}>{row.weight.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {riskInsight && (
              <p style={{
                margin: '4px 20px 0',
                paddingTop: 12,
                borderTop: '1px solid var(--hair-soft)',
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--color-neutral-500)',
              }}>
                {riskInsight}
              </p>
            )}
          </div>
        </section>
      )}
      </div>

      {/* 4. Table */}
      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <SectionHeader
          title="Todas as posições"
          subtitle="Clique em uma linha para abrir a análise completa do ativo."
          action={
            <div style={{display: 'flex', gap: 8}}>
              <button
                type="button"
                onClick={() => setB3GuideOpen(true)}
                disabled={isUploadingB3}
                style={{
                  height: 30,
                  padding: '0 11.2px',
                  border: '1px solid var(--hair)',
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'var(--color-neutral-400)',
                  cursor: isUploadingB3 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5.6,
                }}>
                {isUploadingB3 ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <i className="ph ph-upload" style={{fontSize: 14}} />
                )}
                Importar B3
              </button>
              <button
                type="button"
                onClick={handleExportXlsx}
                style={{
                  height: 30,
                  padding: '0 11.2px',
                  border: '1px solid var(--hair)',
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'var(--color-neutral-400)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5.6,
                }}>
                <i className="ph ph-file-xls" style={{fontSize: 14}} /> Exportar
              </button>
              <ColumnConfigurator visibleCols={visibleCols} onToggle={toggleCol} />
            </div>
          }
        />
        <DataTable minWidth={900} columns={activeColumns}>
          {loading ? (
            <tr>
              <td colSpan={activeColumns.length} style={{...TD_STYLE, textAlign: 'center', color: 'var(--color-neutral-500)'}}>
                <Loader2 className="h-4 w-4 animate-spin" style={{display: 'inline-block'}} />
              </td>
            </tr>
          ) : filteredAssets.length === 0 ? (
            <tr>
              <td colSpan={activeColumns.length} style={{...TD_STYLE, textAlign: 'center', color: 'var(--color-neutral-500)', fontSize: 12.5}}>
                Nenhum ativo encontrado.
              </td>
            </tr>
          ) : (
            filteredAssets.map((asset) => (
              <tr
                key={asset._id || asset.symbol}
                onClick={() => openAssetDetails(asset)}
                style={{borderTop: '1px solid var(--hair-soft)', cursor: 'pointer'}}
                className="hover:bg-[rgba(145,132,217,0.06)]">
                <td style={{padding: '9.8px 16.8px', fontWeight: 600}}>{asset.symbol}</td>
                {(visibleCols['class'] ?? true) && (
                  <td style={{padding: '9.8px 16.8px', color: 'var(--color-neutral-500)', fontSize: 11.5}}>{asset.type}</td>
                )}
                {(visibleCols['qty'] ?? true) && (
                  <td style={{...TD_RIGHT, fontVariantNumeric: 'tabular-nums'}}>{asset.amount}</td>
                )}
                {(visibleCols['avgPrice'] ?? true) && (
                  <td style={{...TD_RIGHT, fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(asset.avgPrice ?? asset.price)}</td>
                )}
                {(visibleCols['price'] ?? true) && (
                  <td style={{...TD_RIGHT, fontVariantNumeric: 'tabular-nums', color: asset.currentPrice == null ? 'var(--color-neutral-500)' : undefined}}>
                    {asset.currentPrice != null ? formatCurrency(asset.currentPrice) : '—'}
                  </td>
                )}
                {(visibleCols['value'] ?? true) && (
                  <td style={{...TD_RIGHT, fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(asset.value)}</td>
                )}
                {(visibleCols['pnl'] ?? true) && (
                  <td style={{...TD_RIGHT, color: asset.profitLoss == null ? 'var(--color-neutral-500)' : asset.profitLoss >= 0 ? 'var(--pos)' : 'var(--neg)', fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>
                    {asset.profitLoss != null ? formatCurrency(asset.profitLoss) : '—'}
                  </td>
                )}
                {(visibleCols['dy'] ?? true) && (
                  <td style={{...TD_RIGHT, fontVariantNumeric: 'tabular-nums'}}>{asset.dividendYield ? `${asset.dividendYield.toFixed(1)}%` : '—'}</td>
                )}
                {(visibleCols['weight'] ?? true) && (
                  <td style={{...TD_RIGHT, color: 'var(--color-neutral-400)', fontVariantNumeric: 'tabular-nums'}}>{asset.allocation?.toFixed(1)}%</td>
                )}
                {(visibleCols['account'] ?? true) && (
                  <td style={{...TD_STYLE, color: 'var(--color-neutral-500)', fontSize: 11.5}}>{asset.account ?? '—'}</td>
                )}
                {(visibleCols['beta'] ?? false) && (
                  <td style={{...TD_RIGHT, fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-400)'}}>
                    {asset.beta != null ? asset.beta.toFixed(2) : '—'}
                  </td>
                )}
                {(visibleCols['signal'] ?? true) && (
                  <td style={{...TD_RIGHT}}>
                    <SignalBadge signal={asset.signal} />
                  </td>
                )}
              </tr>
            ))
          )}
        </DataTable>
      </section>

      {/* Asset Detail Modal */}
      <AssetDetailModal selectedAsset={selectedAsset} setSelectedAsset={setSelectedAsset} />

      <B3ImportGuideModal
        open={b3GuideOpen}
        onOpenChange={setB3GuideOpen}
        onImportReport={() => {
          setB3GuideOpen(false);
          document.getElementById('b3-upload')?.click();
        }}
        onGoToTransactions={() => {
          setB3GuideOpen(false);
          navigate('/transactions');
        }}
      />
    </div>
  );
};

export default Portfolio;
