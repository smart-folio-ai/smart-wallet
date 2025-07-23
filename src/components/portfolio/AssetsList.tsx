
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUpDown, Building, Coins, TrendingUp } from "lucide-react";
import { Asset, SortConfig } from "@/types/portfolio";
import { formatCurrency } from "@/utils/formatters";

interface AssetsListProps {
  assets: Asset[];
  loading: boolean;
  onAssetClick: (asset: Asset) => void;
  requestSort: (key: keyof Asset) => void;
  sortConfig: SortConfig;
}

export const AssetsList = ({ 
  assets, 
  loading, 
  onAssetClick, 
  requestSort, 
  sortConfig 
}: AssetsListProps) => {
  const getSortIcon = (field: keyof Asset) => {
    if (sortConfig.key !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m18 15-6-6-6 6"/></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m6 9 6 6 6-6"/></svg>
    );
  };

  // Helper function to get recommendation badge color
  const getRecommendationColor = (recommendation?: 'buy' | 'hold' | 'sell') => {
    if (!recommendation) return '';
    
    switch(recommendation) {
      case 'buy': return 'bg-success/20 text-success';
      case 'sell': return 'bg-destructive/20 text-destructive';
      case 'hold': return 'bg-yellow-500/20 text-yellow-500';
      default: return '';
    }
  };

  // Helper function to translate recommendation
  const translateRecommendation = (recommendation?: 'buy' | 'hold' | 'sell') => {
    if (!recommendation) return '-';
    
    switch(recommendation) {
      case 'buy': return 'Comprar';
      case 'sell': return 'Vender';
      case 'hold': return 'Manter';
      default: return '-';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => requestSort('price')}
            >
              <div className="flex items-center">
                Preço {getSortIcon('price')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => requestSort('avgPrice')}
            >
              <div className="flex items-center">
                Preço Médio {getSortIcon('avgPrice')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => requestSort('change24h')}
            >
              <div className="flex items-center">
                Var. 24h {getSortIcon('change24h')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => requestSort('amount')}
            >
              <div className="flex items-center">
                Qtd. {getSortIcon('amount')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary text-right"
              onClick={() => requestSort('value')}
            >
              <div className="flex items-center justify-end">
                Valor {getSortIcon('value')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary"
              onClick={() => requestSort('aiRecommendation')}
            >
              <div className="flex items-center">
                Recomendação IA {getSortIcon('aiRecommendation')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-primary text-right"
              onClick={() => requestSort('allocation')}
            >
              <div className="flex items-center justify-end">
                Alocação {getSortIcon('allocation')}
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={8}>
                  <div className="h-10 animate-pulse bg-muted rounded" />
                </TableCell>
              </TableRow>
            ))
          ) : assets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                Nenhum ativo encontrado
              </TableCell>
            </TableRow>
          ) : (
            assets.map((asset) => (
              <TableRow 
                key={asset.id}
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => window.location.href = `/asset/${asset.symbol}`}
              >
                <TableCell>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    asset.type === 'stock' ? 'bg-success/20' : 
                    asset.type === 'fii' ? 'bg-purple-500/20' : 
                    'bg-blue-500/20'
                  }`}>
                    {asset.type === 'stock' ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : asset.type === 'fii' ? (
                      <Building className="h-4 w-4 text-purple-500" />
                    ) : (
                      <Coins className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{asset.symbol}</div>
                  <div className="text-xs text-muted-foreground">{asset.name}</div>
                </TableCell>
                <TableCell>{formatCurrency(asset.price)}</TableCell>
                <TableCell>{formatCurrency(asset.avgPrice || 0)}</TableCell>
                <TableCell>
                  <div className={`flex items-center ${asset.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {asset.change24h >= 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="m18 15-6-6-6 6"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1"><path d="m6 9 6 6 6-6"/></svg>
                    )}
                    {Math.abs(asset.change24h).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell>{asset.amount}</TableCell>
                <TableCell className="text-right">{formatCurrency(asset.value)}</TableCell>
                <TableCell>
                  {asset.aiRecommendation ? (
                    <Badge className={getRecommendationColor(asset.aiRecommendation)}>
                      {translateRecommendation(asset.aiRecommendation)}
                    </Badge>
                  ) : (
                    <span>-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    <span className="mr-2">{asset.allocation}%</span>
                    <div className="w-16">
                      <Progress value={asset.allocation} className="h-2" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
