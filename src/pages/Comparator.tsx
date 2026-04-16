import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {GitCompare, Plus, X, TrendingUp, TrendingDown} from 'lucide-react';
import {PremiumBlur} from '@/components/ui/premium-blur';
import {formatCurrency, formatPercentage} from '@/utils/formatters';
import {useSubscription} from '@/hooks/useSubscription';
import Stock from '@/services/stocks';
import {StockAutocompleteInput} from '@/components/stocks/StockAutocompleteInput';
import {normalizeStockSymbol} from '@/components/stocks/stock-autocomplete.utils';

type SelectedAsset = {
  symbol: string;
  name: string;
  logo?: string;
};

export default function Comparator() {
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);
  const [inputValue, setInputValue] = useState('');
  const {hasComparator} = useSubscription();
  const normalizedSearch = String(inputValue || '').trim().toUpperCase();

  const {data: stocksSearchData} = useQuery({
    queryKey: ['comparator-stock-search', normalizedSearch],
    queryFn: async () => {
      const response = await Stock.getAllNacionalStocks(normalizedSearch);
      const normalized = Array.isArray(response) ? response[0] : response;
      const stocks = Array.isArray(normalized?.stocks) ? [...normalized.stocks] : [];
      const pushIfMissing = (candidate: any) => {
        const symbol = normalizeStockSymbol(candidate?.stock || '');
        if (!symbol) return;
        if (stocks.some((s: any) => normalizeStockSymbol(s?.stock || '') === symbol)) {
          return;
        }
        stocks.unshift({
          stock: symbol,
          name: candidate?.name || symbol,
          close: Number(candidate?.close || 0),
          change: Number(candidate?.change || 0),
          logo: candidate?.logo || '',
          type: candidate?.type || 'stock',
        });
      };

      const looksLikeTicker = /^[A-Z]{4}\d{1,2}F?$/.test(normalizedSearch);
      if (looksLikeTicker) {
        try {
          const quote = await Stock.getNationalStock(normalizedSearch);
          const item = quote?.results?.[0];
          const symbol = normalizeStockSymbol(item?.symbol || normalizedSearch);
          pushIfMissing({
            stock: symbol,
            name: item?.longName || item?.shortName || symbol,
            close: Number(item?.regularMarketPrice || 0),
            change: Number(item?.regularMarketChangePercent || 0),
            logo: item?.logourl || '',
            type: 'stock',
          });
        } catch {
          // best effort
        }
      }

      const looksLikeCompanyRoot = /^[A-Z]{4,6}$/.test(normalizedSearch);
      const hasPrefixMatch = stocks.some((s: any) =>
        normalizeStockSymbol(s?.stock || '').startsWith(normalizedSearch),
      );
      if (looksLikeCompanyRoot && !hasPrefixMatch) {
        const candidates = [`${normalizedSearch}3`, `${normalizedSearch}4`, `${normalizedSearch}11`];
        const responses = await Promise.allSettled(
          candidates.map((symbol) => Stock.getNationalStock(symbol)),
        );
        for (const result of responses) {
          if (result.status !== 'fulfilled') continue;
          const item = result.value?.results?.[0];
          const symbol = normalizeStockSymbol(item?.symbol || '');
          if (!symbol) continue;
          pushIfMissing({
            stock: symbol,
            name: item?.longName || item?.shortName || symbol,
            close: Number(item?.regularMarketPrice || 0),
            change: Number(item?.regularMarketChangePercent || 0),
            logo: item?.logourl || '',
            type: 'stock',
          });
        }
      }

      return {
        ...normalized,
        stocks,
      };
    },
    enabled: normalizedSearch.length >= 2,
    staleTime: 2 * 60 * 1000,
  });

  const autocompleteItems = useMemo(
    () =>
      (stocksSearchData?.stocks || []).map((item: any) => ({
        stock: item.stock,
        name: item.name,
        close: Number(item.close || 0),
        change: Number(item.change || 0),
        logo: item.logo || '',
        type: item.type,
      })),
    [stocksSearchData?.stocks],
  );

  const addAsset = (symbolOverride?: string) => {
    const symbol = normalizeStockSymbol(symbolOverride || inputValue || '');
    if (!symbol) return;
    if (selectedAssets.some((item) => item.symbol === symbol)) {
      setInputValue('');
      return;
    }

    const fromCatalog = autocompleteItems.find(
      (item) => normalizeStockSymbol(item.stock) === symbol,
    );
    setSelectedAssets((prev) => [
      ...prev,
      {
        symbol,
        name: fromCatalog?.name || 'Ativo',
        logo: fromCatalog?.logo || '',
      },
    ]);
    setInputValue('');
  };

  const removeAsset = (symbol: string) => {
    setSelectedAssets((prev) => prev.filter((asset) => asset.symbol !== symbol));
  };

  const symbolList = useMemo(
    () => selectedAssets.map((item) => item.symbol),
    [selectedAssets],
  );

  const {data: quoteBySymbol = {}, isLoading: loadingQuotes} = useQuery({
    queryKey: ['comparator-quotes', symbolList.join('|')],
    queryFn: async () => {
      const entries = await Promise.all(
        symbolList.map(async (symbol) => {
          try {
            const response = await Stock.getNationalStock(symbol, {
              fundamental: true,
              dividends: true,
              range: '3mo',
              interval: '1d',
            });
            return [symbol, response?.results?.[0] || null] as const;
          } catch {
            return [symbol, null] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: symbolList.length > 0,
    staleTime: 3 * 60 * 1000,
  });

  const comparisonData = selectedAssets.map((asset) => {
    const q: any = quoteBySymbol[asset.symbol];
    return {
      symbol: asset.symbol,
      name: q?.longName || q?.shortName || asset.name || 'Dados não encontrados',
      logo: q?.logourl || asset.logo || '',
      price: Number(q?.regularMarketPrice || 0),
      change: Number(q?.regularMarketChangePercent || 0),
      marketCap: Number(q?.marketCap || 0),
      pe: Number(q?.priceEarnings || 0),
      pb: Number(q?.priceToBook || 0),
      dividendYield: Number(q?.dividendYield || 0),
      roe: Number(q?.returnOnEquity || 0),
      debtEquity: Number(q?.debtToEquity || 0),
      sector: q?.sector || 'N/A',
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GitCompare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Comparador de Ativos</h1>
            <p className="text-muted-foreground">
              Compare ativos lado a lado com autocomplete e dados de mercado.
            </p>
          </div>
        </div>

        <Card className="mb-6 rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-xl">
          <CardHeader>
            <CardTitle>Adicionar Ativos para Comparação</CardTitle>
            <CardDescription>
              Use o mesmo autocomplete do Adicionar Ativo para buscar e incluir símbolos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <StockAutocompleteInput
                  value={inputValue}
                  stocks={autocompleteItems}
                  placeholder="Digite o símbolo (ex: PETR4)"
                  onValueChange={setInputValue}
                  onSelect={(item) => {
                    addAsset(item.stock);
                  }}
                  onEnter={() => addAsset()}
                />
              </div>
              <Button onClick={() => addAsset()} disabled={!inputValue.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {selectedAssets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((asset) => (
                  <Badge
                    key={asset.symbol}
                    variant="secondary"
                    className="flex items-center gap-2">
                    {asset.logo ? (
                      <img
                        src={asset.logo}
                        alt={asset.symbol}
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    ) : null}
                    {asset.symbol}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeAsset(asset.symbol)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedAssets.length > 0 && (
          <PremiumBlur
            locked={!hasComparator}
            title="Comparador de Ativos - Premium"
            description="Acesse comparações detalhadas com mais de 20 indicadores financeiros">
            <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle>Comparação Detalhada</CardTitle>
                <CardDescription>
                  {loadingQuotes
                    ? 'Atualizando cotações e fundamentos...'
                    : 'Análise completa dos ativos selecionados'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Indicador</th>
                        {comparisonData.map((asset) => (
                          <th
                            key={asset.symbol}
                            className="text-center p-2 font-medium min-w-[180px]">
                            <div className="flex items-center justify-center gap-2">
                              {asset.logo ? (
                                <img
                                  src={asset.logo}
                                  alt={asset.symbol}
                                  className="h-6 w-6 rounded-full object-cover border border-border"
                                />
                              ) : null}
                              <div>
                                <div className="font-bold">{asset.symbol}</div>
                                <div className="text-xs text-muted-foreground font-normal">
                                  {asset.name}
                                </div>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Preço Atual</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {formatCurrency(asset.price)}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-medium">Variação</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            <div
                              className={`flex items-center justify-center ${
                                asset.change >= 0 ? 'text-emerald-500' : 'text-rose-500'
                              }`}>
                              {asset.change >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {formatPercentage(asset.change)}
                            </div>
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-medium">Setor</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            <Badge variant="outline">{asset.sector}</Badge>
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-medium">Market Cap</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {asset.marketCap > 0
                              ? `${formatCurrency(asset.marketCap / 1e9)}B`
                              : 'N/A'}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-medium">P/L</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {asset.pe > 0 ? asset.pe.toFixed(1) : 'N/A'}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-medium">P/VP</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {asset.pb > 0 ? asset.pb.toFixed(1) : 'N/A'}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-medium">Dividend Yield</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {asset.dividendYield > 0
                              ? formatPercentage(asset.dividendYield)
                              : 'N/A'}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-medium">ROE</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {asset.roe > 0 ? formatPercentage(asset.roe * 100) : 'N/A'}
                          </td>
                        ))}
                      </tr>

                      <tr>
                        <td className="p-2 font-medium">Dívida/Patrimônio</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {asset.debtEquity > 0 ? asset.debtEquity.toFixed(2) : 'N/A'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparisonData.map((asset) => (
                    <Card
                      key={asset.symbol}
                      className="p-4 rounded-2xl bg-card/50 border-primary/20 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        {asset.logo ? (
                          <img
                            src={asset.logo}
                            alt={asset.symbol}
                            className="h-5 w-5 rounded-full object-cover border border-border"
                          />
                        ) : null}
                        <h3 className="font-bold text-lg">{asset.symbol}</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>P/L:</span>
                          <span className={asset.pe > 0 && asset.pe < 15 ? 'text-emerald-500' : 'text-rose-500'}>
                            {asset.pe > 0 ? asset.pe.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>ROE:</span>
                          <span className={asset.roe > 0.15 ? 'text-emerald-500' : 'text-rose-500'}>
                            {asset.roe > 0 ? formatPercentage(asset.roe * 100) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Div. Yield:</span>
                          <span className={asset.dividendYield > 0.05 ? 'text-emerald-500' : 'text-rose-500'}>
                            {asset.dividendYield > 0
                              ? formatPercentage(asset.dividendYield)
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </PremiumBlur>
        )}

        {selectedAssets.length === 0 && (
          <Card className="text-center py-12 rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-xl overflow-hidden">
            <CardContent>
              <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum ativo selecionado</h3>
              <p className="text-muted-foreground">
                Adicione pelo menos um ativo para começar a comparação.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
