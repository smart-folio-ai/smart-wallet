import {useState, useRef, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Separator} from '@/components/ui/separator';
import {CalendarIcon, Plus, TrendingUp, X} from 'lucide-react';
import {useToast} from '@/components/ui/use-toast';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import PortfolioService from '@/services/portfolio';
import Stock from '@/services/stocks';
import {StockAllNacionalResponse} from '@/types/stock';
import {formatCurrency} from '@/utils/formatters';

export default function AddAsset() {
  const {toast} = useToast();
  const [date, setDate] = useState<Date>();
  const symbolRef = useRef<HTMLDivElement>(null);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [showSymbolSuggestions, setShowSymbolSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: '',
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: '',
  });

  const {data: portfolios} = useQuery({
    queryKey: ['portfolios'],
    queryFn: PortfolioService.getPortfolios,
  });

  // Load all stocks for autocomplete
  const {data: allStocks} = useQuery({
    queryKey: ['all-national-stocks'],
    queryFn: async (): Promise<StockAllNacionalResponse> => {
      const response = await Stock.getAllNacionalStocks();
      return Array.isArray(response) ? response[0] : response;
    },
    staleTime: 10 * 60 * 1000,
  });

  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');

  // Symbol autocomplete suggestions — sorted by relevance (prefix first)
  const symbolSuggestions = (() => {
    if (!symbolSearch.trim() || !allStocks) return [];
    const q = symbolSearch.toLowerCase();
    return allStocks.stocks
      .filter(
        (s) =>
          s.stock.toLowerCase().includes(q) ||
          (s.name && s.name.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        const aSymbol = a.stock.toLowerCase();
        const bSymbol = b.stock.toLowerCase();
        // Exact symbol match first
        if (aSymbol === q) return -1;
        if (bSymbol === q) return 1;
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
        // Name match last — alphabetical
        return aSymbol.localeCompare(bSymbol);
      })
      .slice(0, 7);
  })();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (symbolRef.current && !symbolRef.current.contains(e.target as Node)) {
        setShowSymbolSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSymbolSelect = (s: {
    stock: string;
    name: string;
    type: string;
    close: number;
  }) => {
    setSymbolSearch(s.stock);
    setFormData((prev) => ({
      ...prev,
      symbol: s.stock,
      name: s.name,
      type:
        s.type === 'fii'
          ? 'fii'
          : s.type === 'stock'
          ? 'stock'
          : prev.type,
      purchasePrice: s.close ? String(s.close) : prev.purchasePrice,
      currentPrice: s.close ? String(s.close) : prev.currentPrice,
    }));
    setShowSymbolSuggestions(false);
  };

  const queryClient = useQueryClient();

  const addAssetMutation = useMutation({
    mutationFn: (assetData: any) =>
      PortfolioService.addAssetToPortfolio(selectedPortfolioId, assetData),
    onSuccess: () => {
      toast({
        title: 'Ativo adicionado!',
        description: `${formData.symbol} foi adicionado ao seu portfólio com sucesso.`,
      });

      queryClient.invalidateQueries({queryKey: ['portfolioAssets']});
      queryClient.invalidateQueries({queryKey: ['dashboardAssets']});
      queryClient.invalidateQueries({queryKey: ['portfolios']});

      // Reset form
      setFormData({
        symbol: '',
        name: '',
        type: '',
        quantity: '',
        purchasePrice: '',
        currentPrice: '',
        purchaseDate: '',
      });
      setSymbolSearch('');
      setDate(undefined);
    },
    onError: () => {
      toast({
        title: 'Não foi possível adicionar o ativo',
        description: 'Revise as informações do ativo e tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.symbol ||
      !formData.type ||
      !formData.quantity ||
      !formData.purchasePrice ||
      !selectedPortfolioId
    ) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    addAssetMutation.mutate({
      symbol: formData.symbol,
      quantity: Number(formData.quantity),
      price: Number(formData.purchasePrice),
      type: formData.type,
      date: date ? date.toISOString() : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Adicionar Ativo</h1>
            <p className="text-muted-foreground">
              Adicione um novo ativo ao seu portfólio manualmente
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Ativo</CardTitle>
                <CardDescription>
                  Preencha os dados do ativo que deseja adicionar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Symbol with Autocomplete */}
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Símbolo do Ativo *</Label>
                      <div ref={symbolRef} className="relative">
                        <Input
                          id="symbol"
                          placeholder="Ex: PETR4, VALE3..."
                          value={symbolSearch}
                          onChange={(e) => {
                            const v = e.target.value.toUpperCase();
                            setSymbolSearch(v);
                            handleInputChange('symbol', v);
                            setShowSymbolSuggestions(true);
                          }}
                          onFocus={() =>
                            symbolSearch && setShowSymbolSuggestions(true)
                          }
                          autoComplete="off"
                          required
                        />
                        {symbolSearch && (
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSymbolSearch('');
                              handleInputChange('symbol', '');
                              setShowSymbolSuggestions(false);
                            }}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {showSymbolSuggestions &&
                          symbolSuggestions.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                              {symbolSuggestions.map((s) => (
                                <button
                                  key={s.stock}
                                  type="button"
                                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-primary/10 transition-colors text-left"
                                  onMouseDown={() => handleSymbolSelect(s)}>
                                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">
                                      {s.stock}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {s.name}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-xs font-medium">
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
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Ativo</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Petrobras PN"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange('name', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo de Ativo *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) =>
                          handleInputChange('type', value)
                        }>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de ativo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stock">Ação</SelectItem>
                          <SelectItem value="fii">FII</SelectItem>
                          <SelectItem value="crypto">Criptomoeda</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="portfolio">Selecione o Portfólio *</Label>
                      <Select
                        value={selectedPortfolioId}
                        onValueChange={setSelectedPortfolioId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um portfólio" />
                        </SelectTrigger>
                        <SelectContent>
                          {portfolios &&
                            portfolios.map((p: any) => (
                              <SelectItem
                                key={p.id || p._id}
                                value={p.id || p._id}>
                                {p.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="100"
                        value={formData.quantity}
                        onChange={(e) =>
                          handleInputChange('quantity', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">
                        Preço de Compra (R$) *
                      </Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        step="0.01"
                        placeholder="25.50"
                        value={formData.purchasePrice}
                        onChange={(e) =>
                          handleInputChange('purchasePrice', e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPrice">Preço Atual (R$)</Label>
                      <Input
                        id="currentPrice"
                        type="number"
                        step="0.01"
                        placeholder="28.75"
                        value={formData.currentPrice}
                        onChange={(e) =>
                          handleInputChange('currentPrice', e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Data de Compra</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date
                              ? format(date, 'dd/MM/yyyy', {locale: ptBR})
                              : 'Selecionar data'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={addAssetMutation.isPending}>
                      <Plus className="mr-2 h-4 w-4" />
                      {addAssetMutation.isPending
                        ? 'Adicionando...'
                        : 'Adicionar Ativo'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Informações laterais */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Dicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Autocomplete de Símbolos</h4>
                  <p className="text-sm text-muted-foreground">
                    Ao digitar o símbolo, sugestões aparecem automaticamente com
                    nome e preço atual
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Preço de Compra</h4>
                  <p className="text-sm text-muted-foreground">
                    Preenchido automaticamente ao selecionar o ativo. Edite se
                    necessário
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Data de Compra</h4>
                  <p className="text-sm text-muted-foreground">
                    Ajuda no cálculo de impostos e análise temporal
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
