
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GitCompare, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { PremiumBlur } from '@/components/ui/premium-blur';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

// Mock data para demonstração
const mockAssetData = {
  'PETR4': {
    name: 'Petrobras PN',
    price: 28.75,
    change: 2.3,
    marketCap: 374000000000,
    pe: 4.2,
    pb: 0.8,
    dividendYield: 12.5,
    roe: 18.2,
    debtEquity: 0.35,
    sector: 'Energia'
  },
  'VALE3': {
    name: 'Vale ON',
    price: 65.42,
    change: -1.2,
    marketCap: 295000000000,
    pe: 3.8,
    pb: 1.2,
    dividendYield: 8.7,
    roe: 22.1,
    debtEquity: 0.28,
    sector: 'Mineração'
  },
  'AAPL': {
    name: 'Apple Inc.',
    price: 185.25,
    change: 0.8,
    marketCap: 2900000000000,
    pe: 28.5,
    pb: 6.2,
    dividendYield: 0.5,
    roe: 26.4,
    debtEquity: 1.73,
    sector: 'Tecnologia'
  }
};

export default function Comparator() {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addAsset = () => {
    if (inputValue.trim() && !selectedAssets.includes(inputValue.toUpperCase())) {
      setSelectedAssets([...selectedAssets, inputValue.toUpperCase()]);
      setInputValue('');
    }
  };

  const removeAsset = (asset: string) => {
    setSelectedAssets(selectedAssets.filter(a => a !== asset));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addAsset();
    }
  };

  const comparisonData = selectedAssets.map(symbol => ({
    symbol,
    ...mockAssetData[symbol as keyof typeof mockAssetData] || {
      name: 'Dados não encontrados',
      price: 0,
      change: 0,
      marketCap: 0,
      pe: 0,
      pb: 0,
      dividendYield: 0,
      roe: 0,
      debtEquity: 0,
      sector: 'N/A'
    }
  }));

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
              Compare ações nacionais e internacionais lado a lado
            </p>
          </div>
        </div>

        {/* Seção para adicionar ativos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Adicionar Ativos para Comparação</CardTitle>
            <CardDescription>
              Digite o símbolo do ativo (ex: PETR4, AAPL, VALE3) e pressione Enter ou clique em Adicionar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Digite o símbolo (ex: PETR4)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={addAsset} disabled={!inputValue.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {/* Lista de ativos selecionados */}
            {selectedAssets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((asset) => (
                  <Badge key={asset} variant="secondary" className="flex items-center gap-2">
                    {asset}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeAsset(asset)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de comparação */}
        {selectedAssets.length > 0 && (
          <PremiumBlur
            title="Comparador de Ativos - Premium"
            description="Acesse comparações detalhadas com mais de 20 indicadores financeiros"
          >
            <Card>
              <CardHeader>
                <CardTitle>Comparação Detalhada</CardTitle>
                <CardDescription>
                  Análise completa dos ativos selecionados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Indicador</th>
                        {comparisonData.map((asset) => (
                          <th key={asset.symbol} className="text-center p-2 font-medium min-w-[120px]">
                            <div>
                              <div className="font-bold">{asset.symbol}</div>
                              <div className="text-xs text-muted-foreground font-normal">
                                {asset.name}
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
                            <div className={`flex items-center justify-center ${
                              asset.change >= 0 ? 'text-green-500' : 'text-red-500'
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
                            {formatCurrency(asset.marketCap / 1000000000)}B
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-medium">P/L</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {asset.pe.toFixed(1)}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-medium">P/VP</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {asset.pb.toFixed(1)}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-medium">Dividend Yield</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {formatPercentage(asset.dividendYield)}
                          </td>
                        ))}
                      </tr>

                      <tr className="border-b">
                        <td className="p-2 font-medium">ROE</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {formatPercentage(asset.roe)}
                          </td>
                        ))}
                      </tr>

                      <tr>
                        <td className="p-2 font-medium">Dívida/Patrimônio</td>
                        {comparisonData.map((asset) => (
                          <td key={asset.symbol} className="text-center p-2">
                            {asset.debtEquity.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparisonData.map((asset) => (
                    <Card key={asset.symbol} className="p-4">
                      <h3 className="font-bold text-lg mb-2">{asset.symbol}</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>P/L:</span>
                          <span className={asset.pe < 15 ? 'text-green-500' : 'text-red-500'}>
                            {asset.pe.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>ROE:</span>
                          <span className={asset.roe > 15 ? 'text-green-500' : 'text-red-500'}>
                            {formatPercentage(asset.roe)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Div. Yield:</span>
                          <span className={asset.dividendYield > 5 ? 'text-green-500' : 'text-red-500'}>
                            {formatPercentage(asset.dividendYield)}
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
          <Card className="text-center py-12">
            <CardContent>
              <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum ativo selecionado</h3>
              <p className="text-muted-foreground">
                Adicione pelo menos um ativo para começar a comparação
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
