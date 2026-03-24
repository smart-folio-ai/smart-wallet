import {useMemo, useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {Badge} from '@/components/ui/badge';
import {ArrowUpDown, Building, Coins, TrendingUp} from 'lucide-react';
import {Asset, SortConfig} from '@/types/portfolio';
import {formatCurrency} from '@/utils/formatters';
import portfolioService from '@/services/portfolio';
import {Input} from '@/components/ui/input';

interface AssetsListProps {
  assets: Asset[];
  loading: boolean;
  onAssetClick: (asset: Asset) => void;
  requestSort: (key: keyof Asset) => void;
  sortConfig: SortConfig;
}

type DecisionStatus =
  | 'Comprar aos poucos'
  | 'Manter'
  | 'Revisar'
  | 'Sobrepeso'
  | 'Aguardar'
  | 'Sem cobertura';

const STATUS_BADGE_CLASS: Record<DecisionStatus, string> = {
  'Comprar aos poucos':
    'h-7 rounded-full border-0 bg-emerald-900/35 px-3 text-emerald-400',
  Manter: 'h-7 rounded-full border-0 bg-sky-900/35 px-3 text-sky-300',
  Revisar: 'h-7 rounded-full border-0 bg-amber-900/35 px-3 text-amber-300',
  Sobrepeso: 'h-7 rounded-full border-0 bg-rose-900/35 px-3 text-rose-300',
  Aguardar: 'h-7 rounded-full border-0 bg-slate-700/55 px-3 text-slate-200',
  'Sem cobertura':
    'h-7 rounded-full border border-border/50 bg-background/40 px-3 text-muted-foreground',
};

const resolveDecisionStatus = (asset: Asset): DecisionStatus => {
  if (asset.aiRecommendation === 'buy') return 'Comprar aos poucos';
  if (asset.aiRecommendation === 'hold') return 'Manter';
  if (asset.aiRecommendation === 'sell') return 'Revisar';
  if (asset.allocation >= 25) return 'Sobrepeso';
  if ((asset.change24h || 0) <= -3) return 'Aguardar';
  return 'Sem cobertura';
};

const resolveRiskLabel = (asset: Asset): 'Alto' | 'Médio' | 'Baixo' => {
  const movement = Math.abs(Number(asset.change24h || 0));
  if (movement >= 5) return 'Alto';
  if (movement >= 2) return 'Médio';
  return 'Baixo';
};

export const AssetsList = ({
  assets,
  loading,
  onAssetClick,
  requestSort,
  sortConfig,
}: AssetsListProps) => {
  const queryClient = useQueryClient();
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [draftAvgPrice, setDraftAvgPrice] = useState<string>('');

  const assetsById = useMemo(() => {
    const map = new Map<string, Asset>();
    for (const asset of assets) {
      const id = (asset as any).id || (asset as any)._id || asset.symbol;
      map.set(String(id), asset);
    }
    return map;
  }, [assets]);

  const updateAvgPriceMutation = useMutation({
    mutationFn: async (params: {assetId: string; avgPrice: number}) => {
      const asset = assetsById.get(params.assetId);
      const quantity = (asset as any)?.amount ?? (asset as any)?.quantity;
      return portfolioService.updateAsset(params.assetId, {
        avgPrice: params.avgPrice,
        ...(typeof quantity === 'number' ? {quantity} : {}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['portfolioAssets']});
      await queryClient.invalidateQueries({
        queryKey: ['portfolio-assets-for-symbol'],
      });
    },
    onSettled: () => {
      setEditingAssetId(null);
      setDraftAvgPrice('');
    },
  });

  const startEditAvgPrice = (asset: Asset) => {
    const id = String((asset as any).id || (asset as any)._id || asset.symbol);
    const currentAvg = (asset as any).avgPrice ?? (asset as any).purchasePrice ?? 0;
    setEditingAssetId(id);
    setDraftAvgPrice(String(currentAvg));
  };

  const commitAvgPrice = () => {
    if (!editingAssetId) return;
    const normalized = draftAvgPrice.replace(',', '.').trim();
    const next = Number(normalized);
    if (!Number.isFinite(next) || next <= 0) {
      setEditingAssetId(null);
      setDraftAvgPrice('');
      return;
    }
    updateAvgPriceMutation.mutate({assetId: editingAssetId, avgPrice: next});
  };

  const getSortIcon = (field: keyof Asset) => {
    if (sortConfig.key !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4">
        <path d="m18 15-6-6-6 6" />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4">
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Ativo</TableHead>
            <TableHead className="cursor-pointer hover:text-primary" onClick={() => requestSort('price')}>
              <div className="flex items-center">Preço atual {getSortIcon('price')}</div>
            </TableHead>
            <TableHead className="cursor-pointer hover:text-primary" onClick={() => requestSort('avgPrice')}>
              <div className="flex items-center">Preço médio {getSortIcon('avgPrice')}</div>
            </TableHead>
            <TableHead className="cursor-pointer hover:text-primary text-right" onClick={() => requestSort('allocation')}>
              <div className="flex items-center justify-end">% patrimônio {getSortIcon('allocation')}</div>
            </TableHead>
            <TableHead className="cursor-pointer hover:text-primary text-right" onClick={() => requestSort('profitLossPercentage')}>
              <div className="flex items-center justify-end">Resultado período {getSortIcon('profitLossPercentage')}</div>
            </TableHead>
            <TableHead>Status IA</TableHead>
            <TableHead>Risco (24h)</TableHead>
            <TableHead className="cursor-pointer hover:text-primary text-right" onClick={() => requestSort('dividendYield')}>
              <div className="flex items-center justify-end">DY {getSortIcon('dividendYield')}</div>
            </TableHead>
            <TableHead className="cursor-pointer hover:text-primary text-right" onClick={() => requestSort('value')}>
              <div className="flex items-center justify-end">Valor {getSortIcon('value')}</div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({length: 5}).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={10}>
                  <div className="h-10 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ))
          ) : assets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                Nenhum ativo encontrado
              </TableCell>
            </TableRow>
          ) : (
            assets.map((asset) => {
              const decisionStatus = resolveDecisionStatus(asset);
              const riskLabel = resolveRiskLabel(asset);
              const rowResult = Number.isFinite(Number(asset.profitLossPercentage))
                ? Number(asset.profitLossPercentage || 0)
                : Number(asset.change24h || 0);

              return (
                <TableRow
                  key={String(asset._id || asset.symbol)}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => onAssetClick(asset)}>
                  <TableCell>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        asset.type === 'stock' || asset.type === 'etf'
                          ? 'bg-success/20'
                          : asset.type === 'fii'
                            ? 'bg-purple-500/20'
                            : 'bg-blue-500/20'
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
                  <TableCell>{formatCurrency((asset as any).currentPrice ?? asset.price)}</TableCell>
                  <TableCell
                    className="select-none"
                    onClick={(event) => {
                      event.stopPropagation();
                      startEditAvgPrice(asset);
                    }}>
                    {String((asset as any).id || (asset as any)._id || asset.symbol) ===
                    editingAssetId ? (
                      <Input
                        value={draftAvgPrice}
                        onChange={(event) => setDraftAvgPrice(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                          if (event.key === 'Enter') commitAvgPrice();
                          if (event.key === 'Escape') {
                            setEditingAssetId(null);
                            setDraftAvgPrice('');
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
                            0,
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{asset.allocation.toFixed(2)}%</TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      rowResult >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                    {rowResult >= 0 ? '+' : ''}
                    {rowResult.toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE_CLASS[decisionStatus]}>
                      {decisionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        riskLabel === 'Alto'
                          ? 'border-rose-500/40 text-rose-400'
                          : riskLabel === 'Médio'
                            ? 'border-amber-500/40 text-amber-300'
                            : 'border-emerald-500/40 text-emerald-300'
                      }>
                      {riskLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {asset.dividendYield && asset.dividendYield > 0
                      ? `${asset.dividendYield.toFixed(2)}%`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(
                      (asset as any).value ??
                        ((asset as any).currentPrice ?? asset.price) *
                          ((asset as any).amount ?? (asset as any).quantity ?? 0),
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
