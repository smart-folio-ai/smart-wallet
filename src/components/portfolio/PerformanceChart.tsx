import {useState} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  TooltipProps,
} from 'recharts';
import {Asset, AssetPerformance} from '@/types/portfolio';
import {formatCurrency} from '@/utils/formatters';
import {CustomTooltip} from '@/components/ui/custom-tooltip';

interface PerformanceChartProps {
  loading: boolean;
  activeTab: string;
  assets: Asset[];
  portfolioHistory: any[];
}

export const PerformanceChart = ({
  loading,
  activeTab,
  assets,
  portfolioHistory,
}: PerformanceChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');

  const getChartData = () => {
    // If no portfolio history is available from the backend, show empty initially
    let aggregatedData = portfolioHistory.map((item) => ({
      date: item.date,
      price: item.totalValue
    }));

    if (aggregatedData.length === 0) {
      // 1. fallback to calculating from current assets value if no history exists yet
      // This displays just today's value as a data point
      const filteredAssets = assets.filter(
        (asset) => activeTab === 'all' || asset.type === activeTab
      );
      const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.value, 0);
      const today = new Date().toISOString().split('T')[0];
      aggregatedData = [{ date: today, price: totalValue }];
    } else {
       // Filter total value based on activeTab (history is usually for the whole portfolio, not per asset)
       // Since the backend only records the total portfolio value per day,
       // filtering history by 'stock' or 'crypto' would require recording history PER ASSET.
       // For now, if activeTab !== 'all', the chart might just show the whole portfolio history or we can hide it.
       // Assuming portfolioHistory already contains the total values. We'll just display it.
    }

    // 3. Sort by date
    aggregatedData = aggregatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 4. Filter by period
    if (aggregatedData.length > 0) {
      let daysToKeep = aggregatedData.length;
      switch (selectedPeriod) {
        case '1D':
          daysToKeep = 2; // Requires 2 points minimum to draw a line
          break;
        case '1S':
          daysToKeep = 7;
          break;
        case '1M':
          daysToKeep = 30;
          break;
        case '3M':
          daysToKeep = 90;
          break;
        case '6M':
          daysToKeep = 180;
          break;
        case 'YTD':
          {
            const lastDate = new Date(
              aggregatedData[aggregatedData.length - 1].date
            );
            const startOfYear = new Date(lastDate.getFullYear(), 0, 1);
            daysToKeep = Math.max(
              2,
              Math.ceil(
                (lastDate.getTime() - startOfYear.getTime()) /
                  (1000 * 3600 * 24)
              )
            );
          }
          break;
        case '1A':
          daysToKeep = 365;
          break;
        case 'MAX':
        default:
          daysToKeep = aggregatedData.length;
          break;
      }

      if (daysToKeep < aggregatedData.length) {
        aggregatedData = aggregatedData.slice(aggregatedData.length - daysToKeep);
      }
    }

    return aggregatedData;
  };

  return (
    <Card className="mb-8 card-gradient">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Desempenho</CardTitle>
            <CardDescription>Evolução do valor por período</CardDescription>
          </div>
          <div className="flex space-x-1">
            {['1D', '1S', '1M', '3M', '6M', 'YTD', '1A', 'MAX'].map(
              (period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className="text-xs h-8">
                  {period}
                </Button>
              )
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-72 animate-pulse bg-muted rounded" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={getChartData()}
                margin={{top: 10, right: 10, left: 10, bottom: 10}}>
                <defs>
                  <linearGradient
                    id="colorPerformance"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{fontSize: 12}}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    });
                  }}
                />
                <YAxis
                  tick={{fontSize: 12}}
                  tickFormatter={(value) => formatCurrency(value)}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        'Valor do Portfolio',
                      ]}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                    />
                  }
                />

                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPerformance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
