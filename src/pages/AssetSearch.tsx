import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
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
import {Search, TrendingUp, Building, Coins} from 'lucide-react';
import {formatCurrency} from '@/utils/formatters';

// Mock search results
const mockSearchResults = [
  {
    symbol: 'PETR4',
    name: 'Petrobras PN',
    type: 'stock',
    price: 38.45,
    change24h: 2.15,
  },
  {
    symbol: 'VALE3',
    name: 'Vale ON',
    type: 'stock',
    price: 65.8,
    change24h: -1.25,
  },
  {
    symbol: 'ITUB4',
    name: 'Itaú Unibanco PN',
    type: 'stock',
    price: 33.25,
    change24h: 0.85,
  },
  {
    symbol: 'BBDC4',
    name: 'Bradesco PN',
    type: 'stock',
    price: 14.75,
    change24h: -0.45,
  },
  {
    symbol: 'HGLG11',
    name: 'CSHG Logística FII',
    type: 'fii',
    price: 158.9,
    change24h: 1.2,
  },
  {
    symbol: 'XPML11',
    name: 'XP Malls FII',
    type: 'fii',
    price: 95.6,
    change24h: -0.8,
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    price: 250000,
    change24h: 3.45,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    price: 15000,
    change24h: -2.1,
  },
];

const AssetSearch = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);

    // Simulate API call
    setTimeout(() => {
      const results = mockSearchResults.filter(
        (asset) =>
          asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
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
      default:
        return 'Outro';
    }
  };

  return (
    <div className="container py-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Buscar Ativos</h1>
          <p className="text-muted-foreground">
            Pesquise por ações, FIIs ou criptomoedas para ver análises
            detalhadas
          </p>
        </div>

        <Card className="card-gradient mb-6">
          <CardHeader>
            <CardTitle>Pesquisar Ativo</CardTitle>
            <CardDescription>
              Digite o código do ativo ou nome da empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Ex: PETR4, Petrobras, Bitcoin..."
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
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Resultados da Busca</CardTitle>
              <CardDescription>
                {searchResults.length} ativo(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((asset, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => handleAssetClick(asset.symbol)}>
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          asset.type === 'stock'
                            ? 'bg-success/20'
                            : asset.type === 'fii'
                            ? 'bg-purple-500/20'
                            : 'bg-blue-500/20'
                        }`}>
                        {getAssetIcon(asset.type)}
                      </div>
                      <div>
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.name}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {getAssetTypeName(asset.type)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(asset.price)}
                      </div>
                      <div
                        className={`text-sm ${
                          asset.change24h >= 0
                            ? 'text-success'
                            : 'text-destructive'
                        }`}>
                        {asset.change24h >= 0 ? '+' : ''}
                        {asset.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {searchTerm && searchResults.length === 0 && !isSearching && (
          <Card className="card-gradient">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum ativo encontrado para "{searchTerm}"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AssetSearch;
