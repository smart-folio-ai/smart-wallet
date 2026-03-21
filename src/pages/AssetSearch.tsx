import {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Skeleton} from '@/components/ui/skeleton';
import {Search, TrendingUp, Building, Coins, BarChart3, X} from 'lucide-react';
import {formatCurrency} from '@/utils/formatters';
import Stock from '@/services/stocks';
import {StockAllNacionalResponse} from '@/types/stock';

interface Asset {
  stock: string;
  name: string;
  close: number;
  change: number;
  volume: number;
  market_cap: number | null;
  logo: string;
  sector: string;
  type: string;
}

const AssetSearch = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search term before firing server-side query
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Full list (cached, used for the grid)
  const {data: allStocks, isLoading} = useQuery({
    queryKey: ['all-national-stocks'],
    queryFn: async (): Promise<StockAllNacionalResponse> => {
      const response = await Stock.getAllNacionalStocks();
      return Array.isArray(response) ? response[0] : response;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Server-side search — fires when user has typed ≥2 chars
  const {data: searchResults} = useQuery({
    queryKey: ['stock-search', debouncedSearch],
    queryFn: async (): Promise<StockAllNacionalResponse> => {
      const response = await Stock.getAllNacionalStocks(debouncedSearch);
      return Array.isArray(response) ? response[0] : response;
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 30 * 1000,
  });

  // Autocomplete: use server search results when available, fall back to local filter
  const suggestions = (() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    const source = searchResults?.stocks ?? allStocks?.stocks ?? [];
    return source
      .filter(
        (s) =>
          s.stock.toLowerCase().includes(q) ||
          (s.name && s.name.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        const aSymbol = a.stock.toLowerCase();
        const bSymbol = b.stock.toLowerCase();
        // Exact match first
        if (aSymbol === q && bSymbol !== q) return -1;
        if (bSymbol === q && aSymbol !== q) return 1;
        // Symbol prefix match second
        const aPrefix = aSymbol.startsWith(q);
        const bPrefix = bSymbol.startsWith(q);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;
        // Symbol contains match third
        const aContains = aSymbol.includes(q);
        const bContains = bSymbol.includes(q);
        if (aContains && !bContains) return -1;
        if (bContains && !aContains) return 1;
        // Alphabetical by symbol last
        return aSymbol.localeCompare(bSymbol);
      })
      .slice(0, 8);
  })();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAssetClick = (symbol: string) => {
    navigate(`/asset/${symbol}`);
  };

  const handleSuggestionClick = (symbol: string) => {
    setSearchTerm(symbol);
    setShowSuggestions(false);
    navigate(`/asset/${symbol}`);
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'stock':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'fii':
        return <Building className="h-4 w-4 text-purple-500" />;
      case 'crypto':
        return <Coins className="h-4 w-4 text-blue-500" />;
      case 'index':
        return <BarChart3 className="h-4 w-4 text-orange-500" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getAssetTypeName = (type: string) => {
    switch (type) {
      case 'stock':
        return 'Ação';
      case 'fii':
        return 'FII';
      case 'crypto':
        return 'Cripto';
      case 'index':
        return 'Índice';
      default:
        return 'Outro';
    }
  };

  // Get filtered assets based on active tab (always filter by searchTerm if present)
  const getFilteredAssets = () => {
    // When searching and we have server results, use those
    const source = (searchTerm.trim() && searchResults) ? searchResults : allStocks;
    if (!source) return [];

    const stockList = source.stocks ?? [];
    const indexList = source.indexes ?? [];

    let assets: Asset[] = [];

    if (activeTab === 'all' || activeTab === 'stocks' || activeTab === 'fiis') {
      assets = [
        ...assets,
        ...stockList.map((stock) => ({
          stock: stock.stock,
          name: stock.name,
          close: stock.close,
          change: stock.change,
          volume: stock.volume,
          market_cap: stock.market_cap,
          logo: stock.logo,
          sector: stock.sector,
          type: stock.type,
        })),
      ];
    }

    if (activeTab === 'all' || activeTab === 'indexes') {
      assets = [
        ...assets,
        ...indexList.map((index) => ({
          stock: index.stock,
          name: index.name,
          close: 0,
          change: 0,
          volume: 0,
          market_cap: null,
          logo: '',
          sector: 'Índice',
          type: 'index',
        })),
      ];
    }

    // Client-side filter (for when server results cover a wider set)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const filtered = assets.filter(
        (a) =>
          a.stock.toLowerCase().includes(q) ||
          (a.name && a.name.toLowerCase().includes(q)),
      );
      return filtered.sort((a, b) => {
        const aPrefix = a.stock.toLowerCase().startsWith(q);
        const bPrefix = b.stock.toLowerCase().startsWith(q);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;
        return a.stock.localeCompare(b.stock);
      });
    }

    return assets;
  };

  const filteredAssets = getFilteredAssets();

  const AssetCard = ({asset}: {asset: Asset}) => (
    <Card
      className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 overflow-hidden"
      onClick={() => handleAssetClick(asset.stock)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {asset.logo ? (
              <img
                src={asset.logo}
                alt={asset.name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r ${
                asset.type === 'stock'
                  ? 'from-success/20 to-success/40'
                  : asset.type === 'index'
                  ? 'from-orange-500/20 to-orange-500/40'
                  : 'from-primary/20 to-primary/40'
              } ${asset.logo ? 'hidden' : ''}`}>
              {getAssetIcon(asset.type)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{asset.stock}</h3>
              <p className="text-sm text-muted-foreground truncate max-w-48">
                {asset.name}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="font-medium">
            {getAssetTypeName(asset.type)}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{formatCurrency(asset.close)}</p>
            <p className="text-sm text-muted-foreground">Cotação atual</p>
          </div>
          {asset.change !== 0 && (
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                asset.change >= 0
                  ? 'bg-success/20 text-success'
                  : 'bg-destructive/20 text-destructive'
              }`}>
              {asset.change >= 0 ? '+' : ''}
              {asset.change.toFixed(2)}%
            </div>
          )}
        </div>

        {asset.volume > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Volume: {asset.volume.toLocaleString('pt-BR')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container py-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Buscar Ativos</h1>
          <p className="text-muted-foreground">
            Explore e pesquise ações, FIIs e índices da B3 para análises
            detalhadas
          </p>
        </div>

        {/* Search Card + dropdown wrapper — relative here so dropdown overlaps everything below */}
        <div className="relative mb-6">
          <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
            <CardHeader>
              <CardTitle>Pesquisar Ativo</CardTitle>
              <CardDescription>
                Digite o código ou nome do ativo — resultados aparecem ao digitar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={searchRef} className="relative">
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 pr-9"
                      placeholder="Ex: PETR4, Petrobras, VALE3..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => searchTerm && setShowSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setShowSuggestions(false);
                      }}
                    />
                    {searchTerm && (
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSearchTerm('');
                          setShowSuggestions(false);
                        }}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Autocomplete dropdown — outside Card so it's not clipped by overflow:hidden */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 z-[9999] mt-1 bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={s.stock}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors text-left"
                      onMouseDown={() => handleSuggestionClick(s.stock)}>
                      {s.logo ? (
                        <img
                          src={s.logo}
                          alt={s.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          {getAssetIcon(s.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{s.stock}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium">
                          {formatCurrency(s.close)}
                        </p>
                        <p
                          className={`text-xs ${s.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {s.change >= 0 ? '+' : ''}
                          {s.change?.toFixed(2)}%
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          {/* ↑ end of relative mb-6 wrapper */}
        </div>

        <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
          <CardHeader>
            <CardTitle>Explorar Ativos</CardTitle>
            <CardDescription>
              {searchTerm
                ? `Filtrando por "${searchTerm}" — ${filteredAssets.length} resultado(s)`
                : 'Navegue por todos os ativos disponíveis na B3'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="stocks">Ações</TabsTrigger>
                <TabsTrigger value="fiis">FIIs</TabsTrigger>
                <TabsTrigger value="indexes">Índices</TabsTrigger>
              </TabsList>

              {['all', 'stocks', 'fiis', 'indexes'].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-6">
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({length: 9}).map((_, i) => (
                        <Card key={i} className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <Skeleton className="w-10 h-10 rounded-full" />
                              <div>
                                <Skeleton className="h-5 w-20 mb-1" />
                                <Skeleton className="h-4 w-32" />
                              </div>
                            </div>
                            <Skeleton className="h-8 w-24 mb-2" />
                            <Skeleton className="h-4 w-20" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredAssets.slice(0, 50).map((asset) => (
                        <AssetCard key={asset.stock} asset={asset} />
                      ))}
                      {filteredAssets.length === 0 && (
                        <div className="col-span-3 text-center py-8 text-muted-foreground">
                          Nenhum ativo encontrado para "{searchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetSearch;
