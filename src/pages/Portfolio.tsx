import {useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Download, Share2, Upload, Loader2, Trash2, AlertTriangle} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {useQueryClient, useMutation} from '@tanstack/react-query';

// Components
import {PortfolioSummaryCards} from '@/components/portfolio/PortfolioSummaryCards';
import {PerformanceChart} from '@/components/portfolio/PerformanceChart';
import {AssetAllocationChart} from '@/components/portfolio/AssetAllocationChart';
import {AssetsList} from '@/components/portfolio/AssetsList';
import {AssetsListHeader} from '@/components/portfolio/AssetsListHeader';
import {AssetDetailModal} from '@/components/portfolio/AssetDetailModal';
import {CreatePortfolioDialog} from '@/components/portfolio/CreatePortfolioDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {ConfirmDialog} from '@/components/ConfirmDialog';

// Types and Mock Data
import {Asset, SortConfig} from '@/types/portfolio';
import portfolioService from '@/services/portfolio';
import {useQuery} from '@tanstack/react-query';
import {useSubscription} from '@/hooks/useSubscription';
import {
  buildAiCacheSignature,
  extractAssetRecommendationsFromAnalysis,
  getAiPlanFromPlanName,
  getOrCreateAiAnalysis,
} from '@/services/ai/trakkerAi';

const Portfolio = () => {
  const {toast} = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const {planName} = useSubscription();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [recommendationFilter, setRecommendationFilter] = useState('all');
  const [imbalanceFilter, setImbalanceFilter] = useState('all');
  const [isUploadingB3, setIsUploadingB3] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: '',
    direction: 'asc',
  });

  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {data: portfolios = []} = useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => {
      return await portfolioService.getPortfolios();
    },
  });

  const {data: apiAssets = [], isLoading: loading} = useQuery({
    queryKey: ['portfolioAssets'],
    queryFn: async () => {
      return await portfolioService.getAssets();
    },
  });

  const {data: portfolioHistory = [], isLoading: historyLoading} = useQuery({
    queryKey: ['portfolioHistory', selectedPortfolioId],
    queryFn: async () => {
      if (selectedPortfolioId === 'all') {
        // If we want total history maybe we need another endpoint, but let's assume 'all' gets the summed up history or we fetch individual and sum.
        // For now, if "all" we can just get history for each portfolio and sum them up, or if the API doesn't support 'all', just return empty.
        // Let's call a summary endpoint if it exists, or handle it in chart.
        // Since we only added /:id/history, let's fetch for the selected one.
        return [];
      }
      return await portfolioService.getPortfolioHistory(selectedPortfolioId);
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
      getOrCreateAiAnalysis({
        rawAssets: displayApiAssets,
        plan: aiPlan,
      }),
  });

  const aiRecommendationsBySymbol =
    extractAssetRecommendationsFromAnalysis(portfolioAiAnalysis);

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
      totalApiValue > 0
        ? Number(((a.total / totalApiValue) * 100).toFixed(2))
        : 0,
    type: a.type,
    sector: a.sector ?? undefined,
    aiRecommendation:
      aiRecommendationsBySymbol[String(a.symbol || '').toUpperCase()] ||
      a.aiRecommendation ||
      undefined,
    avgPrice: a.avgPrice ?? a.price,
    purchasePrice: a.avgPrice ?? a.price,
    profitLoss:
      typeof (a.currentPrice ?? a.price) === 'number'
        ? ((a.currentPrice ?? a.price) - (a.avgPrice ?? a.price)) *
          (a.quantity ?? 0)
        : 0,
    profitLossPercentage:
      (a.avgPrice ?? a.price) > 0
        ? (((a.currentPrice ?? a.price) - (a.avgPrice ?? a.price)) /
            (a.avgPrice ?? a.price)) *
          100
        : 0,
    dividendYield: a.indicators?.dividendYield ?? 0,
    lastDividend: 0,
    dividendHistory: a.dividendHistory ?? undefined,
  }));

  // Filter and sort assets
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

  const filteredAssets = assets
    .filter((asset) => {
      if (activeTab !== 'all' && asset.type !== activeTab) return false;
      if (
        searchQuery &&
        !asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      if (sectorFilter !== 'all' && String(asset.sector || '') !== sectorFilter)
        return false;
      if (recommendationFilter !== 'all') {
        if (recommendationFilter === 'uncovered' && asset.aiRecommendation)
          return false;
        if (
          recommendationFilter !== 'uncovered' &&
          asset.aiRecommendation !== recommendationFilter
        )
          return false;
      }
      if (imbalanceFilter === 'overallocated' && asset.allocation <= 20)
        return false;
      if (imbalanceFilter === 'high-risk' && Math.abs(asset.change24h || 0) <= 5)
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
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });

  // Get total values
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  // Sort function
  const requestSort = (key: keyof Asset) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({key, direction});
  };

  // Removed useEffect with mock data

  const openAssetDetails = (asset: Asset) => {
    const id = asset._id || (asset as any).id;
    if (id && id !== 'all') {
      navigate(`/portfolio/asset/${id}`);
    } else if (asset.symbol) {
      // Fallback: navega pelo símbolo se não tiver _id
      navigate(`/portfolio/asset/symbol/${asset.symbol}`);
    } else {
      setSelectedAsset(asset);
    }
  };

  // Calculate additional metrics
  const totalDividends = assets
    .filter((asset) => asset.dividendHistory)
    .reduce((sum, asset) => {
      const assetDividends =
        asset.dividendHistory?.reduce((total, div) => total + div.value, 0) ||
        0;
      return sum + assetDividends * asset.amount;
    }, 0);

  const dividendYield =
    totalValue > 0 ? (totalDividends / totalValue) * 100 : 0;

  const imbalanceInsights = useMemo(() => {
    const overAllocated = assets.filter((asset) => asset.allocation > 20);
    const highRisk = assets.filter((asset) => Math.abs(asset.change24h || 0) > 5);
    const concentrated = assets.filter((asset) => asset.allocation > 25);
    return {
      overAllocated,
      highRisk,
      concentrated,
    };
  }, [assets]);

  const handleB3Import = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedPortfolioId === 'all') {
      toast({
        title: 'Atenção',
        description:
          'Selecione uma carteira específica para importar os ativos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploadingB3(true);
      await portfolioService.importB3Report(selectedPortfolioId, file);
      toast({
        title: 'Importação concluída',
        description: 'Os ativos da B3 foram importados com sucesso.',
      });
      queryClient.invalidateQueries({queryKey: ['portfolioAssets']});
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um problema ao processar o arquivo B3.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingB3(false);
      // reset file input
      e.target.value = '';
    }
  };

  const deletePortfolioMutation = useMutation({
    mutationFn: async (portfolioId: string) => {
      return await portfolioService.deletePortfolio(portfolioId);
    },
    onSuccess: async () => {
      toast({
        title: 'Carteira removida',
        description: 'A carteira foi removida com sucesso.',
      });
      await queryClient.invalidateQueries({queryKey: ['portfolios']});
      await queryClient.invalidateQueries({queryKey: ['portfolioAssets']});
      setSelectedPortfolioId('all');
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: 'Erro ao remover carteira',
        description: 'Não foi possível remover a carteira selecionada.',
        variant: 'destructive',
      });
      setDeleteDialogOpen(false);
    },
  });
  const selectedPortfolioName =
    portfolios.find((p: any) => (p.id || p._id) === selectedPortfolioId)
      ?.name ?? 'esta carteira';

  return (
    <div className="container py-8 min-h-[calc(100vh-4rem)] animate-fade-in overflow-x-hidden">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={location.pathname === '/portfolio' ? 'default' : 'outline'}
          size="sm"
          onClick={() => navigate('/portfolio')}>
          Carteira
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            document
              .getElementById('portfolio-assets-section')
              ?.scrollIntoView({behavior: 'smooth', block: 'start'})
          }>
          Meus ativos
        </Button>
        <Button variant={location.pathname === '/dividends' ? 'default' : 'outline'} size="sm" onClick={() => navigate('/dividends')}>
          Dividendos
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Portfólio</h1>
          <Select
            value={selectedPortfolioId}
            onValueChange={setSelectedPortfolioId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione a Carteira" />
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
          <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Remover carteira?"
            description={
              <>
                Isso vai remover{' '}
                <span className="font-medium">{selectedPortfolioName}</span> e
                todos os ativos importados/manualmente adicionados nela. Essa
                ação não pode ser desfeita.
              </>
            }
            trigger={
              <Button
                variant="outline"
                size="sm"
                disabled={
                  selectedPortfolioId === 'all' ||
                  deletePortfolioMutation.isPending
                }>
                {deletePortfolioMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
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
        <div className="flex space-x-2">
          <CreatePortfolioDialog />
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              id="b3-upload"
              onChange={handleB3Import}
              disabled={isUploadingB3}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('b3-upload')?.click()}
              disabled={isUploadingB3}>
              {isUploadingB3 ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Importar B3
            </Button>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <PortfolioSummaryCards
        totalValue={totalValue}
        assets={assets}
        loading={loading}
        totalDividends={totalDividends}
        dividendYield={dividendYield}
      />

      {/* Performance Chart */}
      <PerformanceChart
        loading={loading || historyLoading}
        activeTab={activeTab}
        assets={assets}
        portfolioHistory={portfolioHistory}
      />

      {/* Asset Allocation Chart & Top Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden h-full">
          <CardHeader>
            <CardTitle>Alocação de Ativos</CardTitle>
            <CardDescription>Top 10 posições + outros e visão por classe</CardDescription>
          </CardHeader>
          <CardContent>
            <AssetAllocationChart assets={assets} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg">Principais Ativos</h3>
          <div className="flex flex-col gap-4">
            {assets
              .sort((a, b) => b.value - a.value)
              .slice(0, 3)
              .map((asset) => {
                const id =
                  '_id' in asset ? (asset as any)._id : (asset as any).id;
                return (
                  <Card
                    key={id || asset.symbol}
                    className="bg-card/50 border-white/5 hover:bg-card/80 transition-colors cursor-pointer"
                    onClick={() => openAssetDetails(asset)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {asset.symbol.substring(0, 1)}
                        </div>
                        <div>
                          <h4 className="font-bold">{asset.symbol}</h4>
                          <p className="text-xs text-muted-foreground">
                            {asset.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          R${' '}
                          {asset.value.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p
                          className={`text-xs ${(asset.change24h || 0) >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                          {(asset.change24h || 0) >= 0 ? '+' : ''}
                          {(asset.change24h || 0).toFixed(2)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            {assets.length === 0 && (
              <div className="text-muted-foreground text-sm p-4">
                Nenhum ativo encontrado.
              </div>
            )}
          </div>
        </div>
      </div>

      <Card className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Visão de desequilíbrio
          </CardTitle>
          <CardDescription>Alertas de concentração e risco com dados atuais da carteira</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg border border-border/50 bg-background/60 p-3">
            <p className="text-muted-foreground">Sobrealocados (&gt; 20%)</p>
            <p className="text-xl font-semibold">{imbalanceInsights.overAllocated.length}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/60 p-3">
            <p className="text-muted-foreground">Alta oscilação (24h &gt; 5%)</p>
            <p className="text-xl font-semibold">{imbalanceInsights.highRisk.length}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/60 p-3">
            <p className="text-muted-foreground">Concentração crítica (&gt; 25%)</p>
            <p className="text-xl font-semibold">{imbalanceInsights.concentrated.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Assets List */}
      <Card id="portfolio-assets-section" className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Ativos</CardTitle>
              <CardDescription>Visão de decisão por ativo com filtros avançados</CardDescription>
            </div>
            <AssetsListHeader
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              requestSort={requestSort}
              sectorFilter={sectorFilter}
              setSectorFilter={setSectorFilter}
              availableSectors={availableSectors}
              recommendationFilter={recommendationFilter}
              setRecommendationFilter={setRecommendationFilter}
              imbalanceFilter={imbalanceFilter}
              setImbalanceFilter={setImbalanceFilter}
            />
          </div>
          <Tabs
            defaultValue="all"
            className="w-full"
            onValueChange={setActiveTab}
            value={activeTab}>
            <TabsList className="w-full md:w-fit">
              <TabsTrigger value="all" className="flex-1 md:flex-none">
                Todos
              </TabsTrigger>
              <TabsTrigger value="stock" className="flex-1 md:flex-none">
                Ações
              </TabsTrigger>
              <TabsTrigger value="fii" className="flex-1 md:flex-none">
                FIIs
              </TabsTrigger>
              <TabsTrigger value="crypto" className="flex-1 md:flex-none">
                Cripto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <AssetsList
                assets={filteredAssets}
                loading={loading}
                onAssetClick={openAssetDetails}
                requestSort={requestSort}
                sortConfig={sortConfig}
              />
            </TabsContent>

            <TabsContent value="stock">
              <AssetsList
                assets={filteredAssets}
                loading={loading}
                onAssetClick={openAssetDetails}
                requestSort={requestSort}
                sortConfig={sortConfig}
              />
            </TabsContent>

            <TabsContent value="fii">
              <AssetsList
                assets={filteredAssets}
                loading={loading}
                onAssetClick={openAssetDetails}
                requestSort={requestSort}
                sortConfig={sortConfig}
              />
            </TabsContent>

            <TabsContent value="crypto">
              <AssetsList
                assets={filteredAssets}
                loading={loading}
                onAssetClick={openAssetDetails}
                requestSort={requestSort}
                sortConfig={sortConfig}
              />
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Asset Detail Modal */}
      <AssetDetailModal
        selectedAsset={selectedAsset}
        setSelectedAsset={setSelectedAsset}
      />
    </div>
  );
};

export default Portfolio;
