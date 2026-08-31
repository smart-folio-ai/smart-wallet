import {useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useToast} from '@/hooks/use-toast';
import {useQueryClient, useMutation} from '@tanstack/react-query';
import {Loader2, Trash2} from '@/components/ui/icons';
import {Button} from '@/components/ui/button';
import {CreatePortfolioDialog} from '@/components/portfolio/CreatePortfolioDialog';
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
import {SectionHeader, DataTable, TD_STYLE, TD_RIGHT} from '@/components/shared';

// ── ColumnConfigurator ─────────────────────────────────────────────────────
function ColumnConfigurator({visibleCols, onToggle}: {visibleCols: Record<string, boolean>; onToggle: (col: string) => void}) {
  const [open, setOpen] = useState(false);
  const cols = ['class', 'qty', 'avgPrice', 'price', 'pnl', 'dy', 'weight'];
  const labels: Record<string, string> = {
    class: 'Classe',
    qty: 'Qtd',
    avgPrice: 'Preço Médio',
    price: 'Cotação',
    pnl: 'P&L R$',
    dy: 'DY',
    weight: 'Peso',
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

// ── Portfolio Page ─────────────────────────────────────────────────────────
const Portfolio = () => {
  const {toast} = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const {planName} = useSubscription();

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
  const [groupTab, setGroupTab] = useState('Todos');
  const filterPills = [
    {label: 'Todos', value: 'all'},
    {label: 'Sobrealocados', value: 'overallocated'},
    {label: 'Alta oscilação', value: 'high-risk'},
  ];
  const [activeFilter, setFilter] = useState('all');
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    class: true,
    qty: true,
    avgPrice: true,
    price: true,
    pnl: true,
    dy: true,
    weight: true,
  });
  const toggleCol = (col: string) =>
    setVisibleCols((prev) => ({...prev, [col]: !(prev[col] ?? true)}));

  // ── Queries (untouched) ───────────────────────────────────────────────
  const {data: portfolios = []} = useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => portfolioService.getPortfolios(),
  });

  const {data: apiAssets = [], isLoading: loading} = useQuery({
    queryKey: ['portfolioAssets'],
    queryFn: async () => portfolioService.getAssets(),
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

  const assets: Asset[] = displayApiAssets.map((a: any) => ({
    _id: a.id || a._id,
    symbol: a.symbol,
    name: a.name || a.symbol,
    price: a.price,
    currentPrice: a.currentPrice ?? undefined,
    change24h: a.change24h ?? 0,
    amount: a.quantity,
    value: a.total,
    allocation:
      totalApiValue > 0 ? Number(((a.total / totalApiValue) * 100).toFixed(2)) : 0,
    type: a.type,
    sector: a.sector ?? undefined,
    avgPrice: a.avgPrice ?? a.price,
    purchasePrice: a.avgPrice ?? a.price,
    profitLoss:
      typeof (a.currentPrice ?? a.price) === 'number'
        ? ((a.currentPrice ?? a.price) - (a.avgPrice ?? a.price)) * (a.quantity ?? 0)
        : 0,
    profitLossPercentage:
      (a.avgPrice ?? a.price) > 0
        ? (((a.currentPrice ?? a.price) - (a.avgPrice ?? a.price)) / (a.avgPrice ?? a.price)) * 100
        : 0,
    dividendYield: a.indicators?.dividendYield ?? 0,
    lastDividend: 0,
    dividendHistory: a.dividendHistory ?? undefined,
  }));

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

  // group-tab → asset type mapping
  const groupTabTypeMap: Record<string, string> = {
    'Renda Variável': 'stock',
    'Renda Fixa': 'fund',
    FIIs: 'fii',
  };

  const filteredAssets = assets
    .filter((asset) => {
      // group tab filter
      if (groupTab !== 'Todos') {
        const mappedType = groupTabTypeMap[groupTab];
        if (mappedType && asset.type !== mappedType) return false;
      }
      // pill filter
      if (activeFilter === 'overallocated' && asset.allocation <= 20) return false;
      if (activeFilter === 'high-risk' && Math.abs(asset.change24h || 0) <= 5) return false;
      // search
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
  // Risk buckets — derived from asset type distribution
  const riskBuckets = useMemo(() => {
    if (assets.length === 0) {
      return [
        {label: 'Baixo', pct: 40, bg: 'rgba(47,214,163,0.12)', textColor: 'var(--pos)'},
        {label: 'Médio', pct: 35, bg: 'rgba(240,179,46,0.10)', textColor: 'var(--warn)'},
        {label: 'Alto', pct: 25, bg: 'rgba(242,80,107,0.10)', textColor: 'var(--neg)'},
      ];
    }
    const lowTypes = new Set(['fund', 'etf', 'other']);
    const medTypes = new Set(['fii']);
    let lowVal = 0, medVal = 0, highVal = 0;
    assets.forEach((a) => {
      if (lowTypes.has(a.type)) lowVal += a.value;
      else if (medTypes.has(a.type)) medVal += a.value;
      else highVal += a.value; // stock, crypto
    });
    const total = lowVal + medVal + highVal || 1;
    return [
      {label: 'Baixo', pct: Math.round((lowVal / total) * 100), bg: 'rgba(47,214,163,0.12)', textColor: 'var(--pos)'},
      {label: 'Médio', pct: Math.round((medVal / total) * 100), bg: 'rgba(240,179,46,0.10)', textColor: 'var(--warn)'},
      {label: 'Alto', pct: Math.round((highVal / total) * 100), bg: 'rgba(242,80,107,0.10)', textColor: 'var(--neg)'},
    ];
  }, [assets]);

  // Active columns for DataTable header
  const allColDefs = [
    {key: 'symbol', label: 'Ativo', always: true},
    {key: 'class', label: 'Classe'},
    {key: 'qty', label: 'Qtd', align: 'right' as const},
    {key: 'avgPrice', label: 'Preço Médio', align: 'right' as const},
    {key: 'price', label: 'Cotação', align: 'right' as const},
    {key: 'pnl', label: 'P&L R$', align: 'right' as const},
    {key: 'dy', label: 'DY', align: 'right' as const},
    {key: 'weight', label: 'Peso', align: 'right' as const},
  ];
  const activeColumns = allColDefs
    .filter((c) => c.always || (visibleCols[c.key] ?? true))
    .map(({label, align}) => ({label, align}));

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>

      {/* Portfolio selector row */}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
            <SelectTrigger style={{width: 200}}>
              <SelectValue placeholder="Selecione a Carteira" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Carteiras</SelectItem>
              {portfolios.map((p: any) => (
                <SelectItem key={p.id || p._id} value={p.id || p._id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                disabled={selectedPortfolioId === 'all' || deletePortfolioMutation.isPending}>
                {deletePortfolioMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Remover
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

        <div style={{display: 'flex', gap: 8}}>
          <CreatePortfolioDialog />
          <div style={{position: 'relative'}}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{display: 'none'}}
              id="b3-upload"
              onChange={handleB3Import}
              disabled={isUploadingB3}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setB3GuideOpen(true)}
              disabled={isUploadingB3}>
              {isUploadingB3 ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <i className="ph ph-upload" style={{fontSize: 14, marginRight: 6}} />
              )}
              Importar B3
            </Button>
          </div>
        </div>
      </div>

      {/* 1. Group tabs */}
      <div style={{display: 'flex', padding: 2.8, gap: 2.8, border: '1px solid var(--hair)', borderRadius: 8, alignSelf: 'flex-start'}}>
        {['Todos', 'Renda Variável', 'Renda Fixa', 'FIIs'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setGroupTab(tab)}
            style={
              groupTab === tab
                ? {height: 32, padding: '0 14px', fontSize: 12.5, border: 'none', borderRadius: 6, background: 'var(--nk-card)', color: 'var(--color-neutral-100)', boxShadow: '0 1px 3px rgba(0,0,0,0.18)', cursor: 'pointer', fontFamily: 'var(--font-body)'}
                : {height: 32, padding: '0 14px', fontSize: 12.5, border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-500)', cursor: 'pointer', fontFamily: 'var(--font-body)'}
            }>
            {tab}
          </button>
        ))}
      </div>

      {/* 2. Filter pills */}
      <div style={{display: 'flex', gap: 5.6, flexWrap: 'wrap'}}>
        {filterPills.map((f) => (
          <span
            key={f.label}
            onClick={() => setFilter(f.value)}
            style={
              activeFilter === f.value
                ? {padding: '4px 11.2px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: 'rgba(145,132,217,0.18)', color: 'var(--color-accent-100)', border: '1px solid rgba(145,132,217,0.45)'}
                : {padding: '4px 11.2px', borderRadius: 20, fontSize: 12, cursor: 'pointer', background: 'transparent', color: 'var(--color-neutral-500)', border: '1px solid var(--hair)'}
            }>
            {f.label}
          </span>
        ))}
      </div>

      {/* 3. Risk bar */}
      <div style={{border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden'}}>
        <div style={{display: 'flex'}}>
          {riskBuckets.map((b) => (
            <div
              key={b.label}
              style={{flex: b.pct || 1, padding: '9.8px 14px', background: b.bg, borderRight: '1px solid var(--hair)'}}>
              <div style={{fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: b.textColor}}>{b.label}</div>
              <div style={{fontSize: 14, fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums', color: b.textColor}}>{b.pct}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Table */}
      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <SectionHeader
          title="Carteira"
          subtitle={`${filteredAssets.length} ativos`}
          action={<ColumnConfigurator visibleCols={visibleCols} onToggle={toggleCol} />}
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
                  <td style={{...TD_RIGHT, fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(asset.currentPrice ?? asset.price)}</td>
                )}
                {(visibleCols['pnl'] ?? true) && (
                  <td style={{...TD_RIGHT, color: (asset.profitLoss ?? 0) >= 0 ? 'var(--pos)' : 'var(--neg)', fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>
                    {formatCurrency(asset.profitLoss ?? 0)}
                  </td>
                )}
                {(visibleCols['dy'] ?? true) && (
                  <td style={{...TD_RIGHT, fontVariantNumeric: 'tabular-nums'}}>{asset.dividendYield ? `${asset.dividendYield.toFixed(1)}%` : '—'}</td>
                )}
                {(visibleCols['weight'] ?? true) && (
                  <td style={{...TD_RIGHT, color: 'var(--color-neutral-400)', fontVariantNumeric: 'tabular-nums'}}>{asset.allocation?.toFixed(1)}%</td>
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
