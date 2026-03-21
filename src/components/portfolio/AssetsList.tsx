
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUpDown, Building, Coins, TrendingUp } from "lucide-react";
import { Asset, SortConfig } from "@/types/portfolio";
import { formatCurrency } from "@/utils/formatters";
import portfolioService from "@/services/portfolio";
import { Input } from "@/components/ui/input";

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
  const queryClient = useQueryClient();
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [draftAvgPrice, setDraftAvgPrice] = useState<string>("");

  const assetsById = useMemo(() => {
    const map = new Map<string, Asset>();
    for (const a of assets) {
      const id = (a as any).id || (a as any)._id || a.symbol;
      map.set(String(id), a);
    }
    return map;
  }, [assets]);

  const updateAvgPriceMutation = useMutation({
    mutationFn: async (params: { assetId: string; avgPrice: number }) => {
      const asset = assetsById.get(params.assetId);
      const quantity = (asset as any)?.amount ?? (asset as any)?.quantity;
      return portfolioService.updateAsset(params.assetId, {
        avgPrice: params.avgPrice,
        ...(typeof quantity === "number" ? { quantity } : {}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["portfolioAssets"] });
      await queryClient.invalidateQueries({ queryKey: ["portfolio-assets-for-symbol"] });
    },
    onSettled: () => {
      setEditingAssetId(null);
      setDraftAvgPrice("");
    },
  });

  const startEditAvgPrice = (asset: Asset) => {
    const id = String((asset as any).id || (asset as any)._id || asset.symbol);
    const currentAvg =
      (asset as any).avgPrice ??
      (asset as any).purchasePrice ??
      0;
    setEditingAssetId(id);
    setDraftAvgPrice(String(currentAvg));
  };

  const commitAvgPrice = () => {
    if (!editingAssetId) return;
    const normalized = draftAvgPrice.replace(",", ".").trim();
    const next = Number(normalized);
    if (!Number.isFinite(next) || next <= 0) {
      setEditingAssetId(null);
      setDraftAvgPrice("");
      return;
    }
    updateAvgPriceMutation.mutate({ assetId: editingAssetId, avgPrice: next });
  };

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
      case 'buy': return 'h-7 px-3 rounded-full border-0 bg-emerald-900/35 text-emerald-400 font-semibold';
      case 'sell': return 'h-7 px-3 rounded-full border-0 bg-rose-900/35 text-rose-400 font-semibold';
      case 'hold': return 'h-7 px-3 rounded-full border-0 bg-amber-900/35 text-amber-400 font-semibold';
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
                key={asset.symbol}
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => onAssetClick(asset)}
              >
                <TableCell>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    asset.type === 'stock' || asset.type === 'etf' ? 'bg-success/20' : 
                    asset.type === 'fii' ? 'bg-purple-500/20' : 
                    'bg-blue-500/20'
                  }`}>
                    {asset.type === 'stock' || asset.type === 'etf' ? (
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
                <TableCell>
                  {formatCurrency((asset as any).currentPrice ?? asset.price)}
                </TableCell>
                <TableCell
                  className="select-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditAvgPrice(asset);
                  }}
                >
                  {String((asset as any).id || (asset as any)._id || asset.symbol) === editingAssetId ? (
                    <Input
                      value={draftAvgPrice}
                      onChange={(e) => setDraftAvgPrice(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") commitAvgPrice();
                        if (e.key === "Escape") {
                          setEditingAssetId(null);
                          setDraftAvgPrice("");
                        }
                      }}
                      onBlur={commitAvgPrice}
                      disabled={updateAvgPriceMutation.isPending}
                      className="h-8 w-28"
                      inputMode="decimal"
                      aria-label="Editar preço médio"
                    />
                  ) : (
                    <span className="cursor-text">
                      {formatCurrency(
                        (asset as any).avgPrice ??
                          (asset as any).purchasePrice ??
                          (asset as any).price ??
                          0
                      )}
                    </span>
                  )}
                </TableCell>
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
                <TableCell>{(asset as any).amount ?? (asset as any).quantity ?? 0}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    (asset as any).value ??
                      ((asset as any).currentPrice ?? asset.price) *
                        ((asset as any).amount ?? (asset as any).quantity ?? 0)
                  )}
                </TableCell>
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
