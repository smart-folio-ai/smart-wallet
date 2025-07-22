
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Asset } from "@/types/portfolio";
import { formatCurrency, formatPercentage } from "@/utils/formatters";
import { ChevronRight } from "lucide-react";
import { 
  LineChart,
  Line, 
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

interface AssetDetailModalProps {
  selectedAsset: Asset | null;
  setSelectedAsset: (asset: Asset | null) => void;
}

export const AssetDetailModal = ({ selectedAsset, setSelectedAsset }: AssetDetailModalProps) => {
  if (!selectedAsset) return null;

  return (
    <div className="fixed inset-0 bg-background/80 z-50 flex justify-center items-center p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                {selectedAsset.symbol}
                <Badge className="ml-2">
                  {selectedAsset.type === 'stock' ? 'Ação' : 
                   selectedAsset.type === 'fii' ? 'FII' : 
                   selectedAsset.type === 'crypto' ? 'Cripto' : 'Outro'}
                </Badge>
                {selectedAsset.aiRecommendation && (
                  <Badge 
                    className={`ml-2 ${
                      selectedAsset.aiRecommendation === 'buy' ? 'bg-success/20 text-success' : 
                      selectedAsset.aiRecommendation === 'sell' ? 'bg-destructive/20 text-destructive' : 
                      'bg-yellow-500/20 text-yellow-500'
                    }`}
                  >
                    {selectedAsset.aiRecommendation === 'buy' ? 'Comprar' : 
                     selectedAsset.aiRecommendation === 'sell' ? 'Vender' : 
                     'Manter'}
                  </Badge>
                )}
              </h2>
              <p className="text-muted-foreground">{selectedAsset.name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedAsset(null)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preço Atual</span>
                  <span className="font-medium">{formatCurrency(selectedAsset.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preço Médio</span>
                  <span className="font-medium">{formatCurrency(selectedAsset.avgPrice || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Quantidade</span>
                  <span className="font-medium">{selectedAsset.amount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor Total</span>
                  <span className="font-medium">{formatCurrency(selectedAsset.value)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Alocação</span>
                  <span className="font-medium">{selectedAsset.allocation}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Variação 24h</span>
                  <span className={`font-medium ${selectedAsset.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercentage(selectedAsset.change24h)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preço de Compra</span>
                  <span className="font-medium">{formatCurrency(selectedAsset.purchasePrice || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Data de Compra</span>
                  <span className="font-medium">
                    {selectedAsset.purchaseDate ? new Date(selectedAsset.purchaseDate).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Lucro/Prejuízo</span>
                  <span className={`font-medium ${(selectedAsset.profitLoss || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(selectedAsset.profitLoss || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Variação (%)</span>
                  <span className={`font-medium ${(selectedAsset.profitLossPercentage || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercentage(selectedAsset.profitLossPercentage || 0)}
                  </span>
                </div>
                {selectedAsset.aiRecommendation && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Recomendação IA</span>
                    <span className={`font-medium ${
                      selectedAsset.aiRecommendation === 'buy' ? 'text-success' : 
                      selectedAsset.aiRecommendation === 'sell' ? 'text-destructive' : 
                      'text-yellow-500'
                    }`}>
                      {selectedAsset.aiRecommendation === 'buy' ? 'Comprar' : 
                       selectedAsset.aiRecommendation === 'sell' ? 'Vender' : 
                       'Manter'} ({selectedAsset.aiConfidence}%)
                    </span>
                  </div>
                )}
                {(selectedAsset.type === 'stock' || selectedAsset.type === 'fii') && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Dividend Yield</span>
                    <span className="font-medium text-success">{selectedAsset.dividendYield}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Histórico de Preço</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={selectedAsset.history}
                  margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), "Preço"]}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {(selectedAsset.type === 'stock' || selectedAsset.type === 'fii') && selectedAsset.dividendHistory && (
            <div>
              <h3 className="text-lg font-medium mb-4">Histórico de Dividendos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor por Ação</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAsset.dividendHistory.map((dividend) => (
                    <TableRow key={dividend.date}>
                      <TableCell>{new Date(dividend.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(dividend.value)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(dividend.value * selectedAsset.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button variant="outline" className="mr-2" onClick={() => setSelectedAsset(null)}>
              Fechar
            </Button>
            <Button onClick={() => window.location.href = `/portfolio/${selectedAsset.symbol}`}>
              <ChevronRight className="h-4 w-4 mr-2" />
              Ver Detalhes Completos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
