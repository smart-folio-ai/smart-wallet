import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import {Asset} from '@/types/portfolio';
import {formatCurrency} from '@/utils/formatters';
import {CustomTooltip} from '@/components/ui/custom-tooltip';

interface AssetAllocationChartProps {
  assets: Asset[];
}

export const AssetAllocationChart = ({assets}: AssetAllocationChartProps) => {
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const data = assets.map((asset, index) => ({
    name: asset.symbol,
    value: asset.value,
    percentage: asset.allocation,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={{stroke: 'hsl(var(--foreground))', strokeOpacity: 0.2}}
            label={(props: any) => {
              const {cx, cy, midAngle, outerRadius, name, percentage} = props;
              const RADIAN = Math.PI / 180;
              const radius = outerRadius + 15;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text
                  x={x}
                  y={y}
                  fill="hsl(var(--foreground))"
                  textAnchor={x > cx ? 'start' : 'end'}
                  dominantBaseline="central"
                  fontSize={12}>
                  {name} ({percentage}%)
                </text>
              );
            }}
            outerRadius={80}
            dataKey="value">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            content={
              <CustomTooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name,
                ]}
              />
            }
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
