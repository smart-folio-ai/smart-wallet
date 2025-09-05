
import {ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend} from 'recharts';
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
            labelLine={false}
            label={({name, percentage}) => `${name} (${percentage}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
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
