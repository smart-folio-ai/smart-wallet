import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {formatCurrency, formatPercentage} from '@/utils/formatters';
import {Asset} from '@/types/portfolio';

interface PortfolioSummaryCardsProps {
  totalValue: number;
  assets: Asset[];
  loading: boolean;
  totalDividends: number;
  dividendYield: number;
}

export const PortfolioSummaryCards = ({
  totalValue,
  assets,
  loading,
  totalDividends,
  dividendYield,
}: PortfolioSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="card-gradient">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Valor Total</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-12 animate-pulse bg-muted rounded" />
          ) : (
            <div className="space-y-1">
              <div className="text-3xl font-bold">
                {formatCurrency(totalValue)}
              </div>
              <div className="text-sm text-muted-foreground">
                Ativos: {assets.length}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-gradient">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Rentabilidade</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-12 animate-pulse bg-muted rounded" />
          ) : (
            <div className="space-y-1">
              <div className="flex items-center">
                <div
                  className={`text-3xl font-bold ${
                    assets.reduce(
                      (sum, asset) => sum + (asset.profitLoss || 0),
                      0
                    ) >= 0
                      ? 'text-success'
                      : 'text-destructive'
                  }`}>
                  {formatCurrency(
                    assets.reduce(
                      (sum, asset) => sum + (asset.profitLoss || 0),
                      0
                    )
                  )}
                </div>
                <Badge
                  className={`ml-2 ${
                    assets.reduce(
                      (sum, asset) => sum + (asset.profitLossPercentage || 0),
                      0
                    ) /
                      assets.length >=
                    0
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                  {formatPercentage(
                    assets.reduce(
                      (sum, asset) => sum + (asset.profitLossPercentage || 0),
                      0
                    ) / assets.length
                  )}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Total acumulado
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-gradient">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Dividendos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-12 animate-pulse bg-muted rounded" />
          ) : (
            <div className="space-y-1">
              <div className="text-3xl font-bold text-success">
                {formatCurrency(totalDividends)}
              </div>
              <div className="text-sm text-muted-foreground">
                Yield médio: {dividendYield.toFixed(2)}%
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
