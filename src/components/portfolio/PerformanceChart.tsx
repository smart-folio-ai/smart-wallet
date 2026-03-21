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
} from 'recharts';
import {Asset} from '@/types/portfolio';
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
  const [selectedPeriod, setSelectedPeriod] = useState('3MO');

  const getChartData = () => {
    // If no portfolio history is available from the backend, show empty initially
    let aggregatedData = portfolioHistory.map((item) => ({
      date: item.date,
      price: item.totalValue,
    }));

    if (aggregatedData.length === 0) {
      // 1. fallback to calculating from current assets value if no history exists yet
      // This displays just today's value as a data point
      const filteredAssets = assets.filter(
        (asset) => activeTab === 'all' || asset.type === activeTab,
      );
      const totalValue = filteredAssets.reduce(
        (sum, asset) => sum + asset.value,
        0,
      );
      const today = new Date().toISOString().split('T')[0];
      aggregatedData = [{date: today, price: totalValue}];
    } else {
      // Filter total value based on activeTab (history is usually for the whole portfolio, not per asset)
      // Since the backend only records the total portfolio value per day,
      // filtering history by 'stock' or 'crypto' would require recording history PER ASSET.
      // For now, if activeTab !== 'all', the chart might just show the whole portfolio history or we can hide it.
      // Assuming portfolioHistory already contains the total values. We'll just display it.
    }

    // 3. Sort by date
    aggregatedData = aggregatedData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // 4. Filter by period
    if (aggregatedData.length > 0) {
      let daysToKeep = aggregatedData.length;
      switch (selectedPeriod) {
        case '7D':
          daysToKeep = 7;
          break;
        case '1MO':
          daysToKeep = 30;
          break;
        case '3MO':
          daysToKeep = 90;
          break;
        case '6MO':
          daysToKeep = 180;
          break;
        case '1Y':
          daysToKeep = 365;
          break;
        case '5Y':
          daysToKeep = 365 * 5;
          break;
        case '1S':
        case '1M':
        case '3M':
        case '6M':
        case '1A':
          // legacy values kept for compatibility
          daysToKeep = 30;
          break;
        case 'YTD':
          {
            const lastDate = new Date(
              aggregatedData[aggregatedData.length - 1].date,
            );
            const startOfYear = new Date(lastDate.getFullYear(), 0, 1);
            daysToKeep = Math.max(
              2,
              Math.ceil(
                (lastDate.getTime() - startOfYear.getTime()) /
                  (1000 * 3600 * 24),
              ),
            );
          }
          break;
        case 'MAX':
        default:
          daysToKeep = aggregatedData.length;
          break;
      }

      if (daysToKeep < aggregatedData.length) {
        aggregatedData = aggregatedData.slice(
          aggregatedData.length - daysToKeep,
        );
      }
    }

    return aggregatedData;
  };

  return (
    <Card className="mb-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Cotação</CardTitle>
            <CardDescription>Evolução do valor por período</CardDescription>
          </div>
          <div className="flex space-x-1 bg-secondary/30 p-1 rounded-full">
            {['1S', '1M', '3M', '6M', 'YTD', '1A', 'MAX'].map((period) => (
              <Button
                key={period}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className={`text-xs h-8 rounded-full px-4 font-bold transition-all ${
                  selectedPeriod === period
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}>
                {period === '1S' ? '7D' : period}
              </Button>
            ))}
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
                margin={{top: 10, right: 0, left: 0, bottom: 0}}>
                <defs>
                  <linearGradient
                    id="colorPerformance"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <stop
                      offset="5%"
                      stopColor={
                        getChartData().length >= 2 &&
                        getChartData()[getChartData().length - 1].price >=
                          getChartData()[0].price
                          ? '#10b981'
                          : '#f43f5e'
                      }
                      stopOpacity={0.1}
                    />
                    <stop
                      offset="95%"
                      stopColor={
                        getChartData().length >= 2 &&
                        getChartData()[getChartData().length - 1].price >=
                          getChartData()[0].price
                          ? '#10b981'
                          : '#f43f5e'
                      }
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--muted-foreground)/0.15)"
                />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  cursor={{
                    stroke: 'hsl(var(--muted-foreground)/0.2)',
                    strokeWidth: 1,
                    strokeDasharray: '3 3',
                  }}
                  content={
                    <CustomTooltip
                      formatter={(value) => [
                        formatCurrency(Number(value)),
                        'valor',
                      ]}
                      labelFormatter={(label) =>
                        new Date(label).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: 'numeric',
                        })
                      }
                    />
                  }
                />

                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={
                    getChartData().length >= 2 &&
                    getChartData()[getChartData().length - 1].price >=
                      getChartData()[0].price
                      ? '#10b981'
                      : '#f43f5e'
                  }
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
