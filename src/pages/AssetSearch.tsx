import {useState, useEffect} from 'react';
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
import {Search, TrendingUp, Building, Coins, BarChart3} from 'lucide-react';
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
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch all national stocks
  const { data: allStocks, isLoading } = useQuery({
    queryKey: ['all-national-stocks'],
    queryFn: async (): Promise<StockAllNacionalResponse> => {
      const response = await Stock.getAllNacionalStocks();
      return response[0];
    },
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);

    try {
      const nationalResponse = await Stock.getNationalStock(searchTerm);
      const results: Asset[] = nationalResponse.flatMap(stockData => 
        stockData.results.map(result => ({
          stock: result.symbol,
          name: result.longName || result.shortName,
          close: result.regularMarketPrice,
          change: result.regularMarketChangePercent,
          volume: result.regularMarketVolume,
          market_cap: result.marketCap,
          logo: result.logourl || '',
          sector: 'N/A',
          type: 'stock'
        }))
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssetClick = (symbol: string) => {
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

  // Get filtered assets based on active tab
  const getFilteredAssets = () => {
    if (!allStocks) return [];
    
    let assets: Asset[] = [];
    
    if (activeTab === 'all' || activeTab === 'stocks') {
      assets = [...assets, ...allStocks.stocks.map(stock => ({
        stock: stock.stock,
        name: stock.name,
        close: stock.close,
        change: stock.change,
        volume: stock.volume,
        market_cap: stock.market_cap,
        logo: stock.logo,
        sector: stock.sector,
        type: stock.type
      }))];
    }
    
    if (activeTab === 'all' || activeTab === 'indexes') {
      assets = [...assets, ...allStocks.indexes.map(index => ({
        stock: index.stock,
        name: index.name,
        close: 0,
        change: 0,
        volume: 0,
        market_cap: null,
        logo: '',
        sector: 'Índice',
        type: 'index'
      }))];
    }
    
    return assets;
  };

  const filteredAssets = getFilteredAssets();

  const AssetCard = ({ asset }: { asset: Asset }) => (
    <Card 
      className="card-gradient hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
      onClick={() => handleAssetClick(asset.stock)}
    >
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
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r ${
              asset.type === 'stock' ? 'from-success/20 to-success/40' :
              asset.type === 'index' ? 'from-orange-500/20 to-orange-500/40' :
              'from-primary/20 to-primary/40'
            } ${asset.logo ? 'hidden' : ''}`}>
              {getAssetIcon(asset.type)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{asset.stock}</h3>
              <p className="text-sm text-muted-foreground truncate max-w-48">{asset.name}</p>
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
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
              asset.change >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
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
            Explore e pesquise ações, FIIs e índices da B3 para análises detalhadas
          </p>
        </div>

        <Card className="card-gradient mb-6">
          <CardHeader>
            <CardTitle>Pesquisar Ativo Específico</CardTitle>
            <CardDescription>
              Digite o código do ativo ou nome da empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Ex: PETR4, Petrobras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {searchResults.length > 0 && (
          <Card className="card-gradient mb-6">
            <CardHeader>
              <CardTitle>Resultados da Busca</CardTitle>
              <CardDescription>
                {searchResults.length} ativo(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((asset, index) => (
                  <AssetCard key={`${asset.stock}-${index}`} asset={asset} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {searchTerm && searchResults.length === 0 && !isSearching && (
          <Card className="card-gradient mb-6">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum ativo encontrado para "{searchTerm}"
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>Explorar Ativos</CardTitle>
            <CardDescription>
              Navegue por todos os ativos disponíveis na B3
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="stocks">Ações</TabsTrigger>
                <TabsTrigger value="indexes">Índices</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <Card key={i} className="card-gradient">
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
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stocks" className="mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <Card key={i} className="card-gradient">
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
                ) : allStocks ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allStocks.stocks.slice(0, 50).map((stock) => (
                      <AssetCard key={stock.stock} asset={stock} />
                    ))}
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="indexes" className="mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <Card key={i} className="card-gradient">
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
                ) : allStocks ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allStocks.indexes.map((index) => (
                      <AssetCard key={index.stock} asset={{
                        stock: index.stock,
                        name: index.name,
                        close: 0,
                        change: 0,
                        volume: 0,
                        market_cap: null,
                        logo: '',
                        sector: 'Índice',
                        type: 'index'
                      }} />
                    ))}
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetSearch;
