import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import {Asset} from '@/types/portfolio';
import {formatCurrency} from '@/utils/formatters';
import {Building, Coins, TrendingUp} from 'lucide-react';
import {TooltipProps} from 'recharts';
import {CustomTooltip} from '@/components/ui/custom-tooltip';

interface AssetAllocationChartProps {
  loading: boolean;
  assets: Asset[];
  assetAllocationData: {
    name: string;
    value: number;
    color: string;
  }[];
  openAssetDetails: (asset: Asset) => void;
}

export const AssetAllocationChart = ({
  loading,
  assets,
  assetAllocationData,
  openAssetDetails,
}: AssetAllocationChartProps) => {
  return (
    <Card className="mb-8 card-gradient">
      <CardHeader>
        <CardTitle>Alocação de Ativos</CardTitle>
        <CardDescription>Distribuição por tipo de ativo</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 animate-pulse bg-muted rounded" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetAllocationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({name, percent}) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }>
                    {assetAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <CustomTooltip
                        formatter={(value) => [
                          `${Number(value).toFixed(1)}%`,
                          'Alocação',
                        ]}
                      />
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Principais Ativos</h3>
              {assets
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between bg-background/50 p-3 rounded-lg hover:bg-background/80 cursor-pointer"
                    onClick={() => openAssetDetails(asset)}>
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          asset.type === 'stock'
                            ? 'bg-success/20'
                            : asset.type === 'fii'
                            ? 'bg-purple-500/20'
                            : 'bg-blue-500/20'
                        }`}>
                        {asset.type === 'stock' ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : asset.type === 'fii' ? (
                          <Building className="h-4 w-4 text-purple-500" />
                        ) : (
                          <Coins className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          {asset.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(asset.value)}
                      </div>
                      <div
                        className={`text-xs ${
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
