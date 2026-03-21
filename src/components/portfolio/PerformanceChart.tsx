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
    <Card className="mb-8 overflow-hidden border-slate-800 bg-[#020f2a]">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-slate-100">Desempenho</CardTitle>
            <CardDescription className="text-slate-400">
              Evolução do valor por período
            </CardDescription>
          </div>
          <div className="flex space-x-1 rounded-xl bg-slate-700/40 p-1">
            {['7D', '1MO', '3MO', '6MO', '1Y', '5Y', 'MAX'].map(
              (period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className={`h-7 rounded-lg px-3 text-[11px] font-semibold ${
                    selectedPeriod === period
                      ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                      : 'text-slate-200 hover:bg-slate-700/70 hover:text-white'
                  }`}>
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
                margin={{top: 12, right: 10, left: 10, bottom: 0}}>
                <defs>
                  <linearGradient
                    id="colorPerformance"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1">
                    <stop offset="5%" stopColor="#ff3b73" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ff3b73" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 5"
                  stroke="rgba(148, 163, 184, 0.25)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{fontSize: 11, fill: '#94a3b8'}}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                    });
                  }}
                />
                <YAxis
                  tick={{fontSize: 11, fill: '#94a3b8'}}
                  tickFormatter={(value) =>
                    `R$${Number(value).toLocaleString('pt-BR', {
                      maximumFractionDigits: 0,
                    })}`
                  }
                  domain={['auto', 'auto']}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  cursor={{stroke: 'rgba(226, 232, 240, 0.6)', strokeWidth: 1}}
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
                  stroke="#ff3b73"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPerformance)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: '#ff3b73',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
