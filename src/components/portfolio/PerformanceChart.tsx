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

interface PerformanceChartProps {
  loading: boolean;
  activeTab: string;
  assets: Asset[];
  performanceData: Record<string, AssetPerformance[]>;
}

// Custom tooltip component for better styling
const CustomTooltip = ({active, payload, label}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg px-4 py-3 text-sm font-medium text-foreground">
        <p className="font-semibold text-base mb-1">
          {new Date(label).toLocaleDateString('pt-BR')}
        </p>
        <p className="text-primary text-base">
          {formatCurrency(Number(payload[0].value))}
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip component for better styling
const CustomTooltip = ({active, payload, label}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg px-4 py-3 text-sm font-medium text-foreground">
        <p className="font-semibold text-base mb-1">
          {new Date(label).toLocaleDateString('pt-BR')}
        </p>
        <p className="text-primary text-base">
          {formatCurrency(Number(payload[0].value))}
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip component for better styling
const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg px-4 py-3 text-sm font-medium text-foreground">
        <p className="font-semibold text-base mb-1">
          {new Date(label).toLocaleDateString('pt-BR')}
        </p>
        <p className="text-primary text-base">
          {formatCurrency(Number(payload[0].value))}
        </p>
      </div>
    );
  }
  return null;
};

export const PerformanceChart = ({
  loading,
  activeTab,
  assets,
  performanceData,
}: PerformanceChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');

  // Get performance data based on active tab
  const getPerformanceData = () => {
    switch (activeTab) {
      case 'stock':
        return performanceData.stocks;
      case 'fii':
        return performanceData.fiis;
      case 'crypto':
        return performanceData.crypto;
      default:
        return performanceData.stocks;
    }
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
                data={getPerformanceData().flatMap((data) =>
                  data.period === selectedPeriod
                    ? assets
                        .filter(
                          (asset) =>
                            activeTab === 'all' || asset.type === activeTab
                        )
                        .flatMap((asset) => asset.history || [])
                        .sort(
                          (a, b) =>
                            new Date(a.date).getTime() -
                            new Date(b.date).getTime()
                        )
                    : []
                )}
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
                <Tooltip content={<CustomTooltip />} />

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
