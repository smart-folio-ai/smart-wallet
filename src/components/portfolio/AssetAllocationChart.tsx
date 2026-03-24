import {ResponsiveContainer, Tooltip, Treemap} from 'recharts';
import {Asset} from '@/types/portfolio';
import {formatCurrency} from '@/utils/formatters';
import {CustomTooltip} from '@/components/ui/custom-tooltip';

interface AssetAllocationChartProps {
  assets: Asset[];
}

const TREEMAP_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#14b8a6',
  '#06b6d4',
  '#84cc16',
  '#ef4444',
  '#eab308',
  '#6366f1',
  '#64748b',
];

const TYPE_COLORS: Record<string, string> = {
  stock: '#22c55e',
  fii: '#8b5cf6',
  crypto: '#3b82f6',
  etf: '#14b8a6',
  fund: '#f59e0b',
  other: '#64748b',
};

const TYPE_LABELS: Record<string, string> = {
  stock: 'Ações',
  fii: 'FIIs',
  crypto: 'Cripto',
  etf: 'ETFs',
  fund: 'Fundos',
  other: 'Outros',
};

export const AssetAllocationChart = ({assets}: AssetAllocationChartProps) => {
  const totalValue = assets.reduce((sum, asset) => sum + Number(asset.value || 0), 0);

  const topAssets = [...assets]
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  const otherValue = [...assets]
    .sort((a, b) => b.value - a.value)
    .slice(10)
    .reduce((sum, asset) => sum + Number(asset.value || 0), 0);

  const treeData = [
    ...topAssets.map((asset, index) => ({
      name: asset.symbol,
      value: Number(asset.value || 0),
      percentage:
        totalValue > 0 ? (Number(asset.value || 0) / totalValue) * 100 : 0,
      fill: TREEMAP_COLORS[index % TREEMAP_COLORS.length],
    })),
    ...(otherValue > 0
      ? [
          {
            name: 'Outros',
            value: otherValue,
            percentage: totalValue > 0 ? (otherValue / totalValue) * 100 : 0,
            fill: '#334155',
          },
        ]
      : []),
  ];

  const typeTotals = assets.reduce(
    (acc, asset) => {
      const key = asset.type || 'other';
      const normalizedKey = TYPE_LABELS[key] ? key : 'other';
      acc[normalizedKey] = (acc[normalizedKey] || 0) + Number(asset.value || 0);
      return acc;
    },
    {} as Record<string, number>,
  );

  const classRows = Object.entries(typeTotals)
    .map(([key, value]) => ({
      key,
      label: TYPE_LABELS[key] || 'Outros',
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: TYPE_COLORS[key] || TYPE_COLORS.other,
    }))
    .sort((a, b) => b.value - a.value);

  if (assets.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-border/40 bg-background/50 text-sm text-muted-foreground">
        Sem dados para alocação.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-56 rounded-xl border border-border/40 bg-background/40 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treeData}
            dataKey="value"
            aspectRatio={4 / 3}
            stroke="hsl(var(--background))"
            content={(props: any) => {
              const {x, y, width, height, name, fill} = props || {};
              if (width < 44 || height < 24) return null;
              return (
                <g>
                  <rect x={x} y={y} width={width} height={height} rx={6} ry={6} fill={fill as string} />
                  <text x={Number(x) + 8} y={Number(y) + 18} fill="#f8fafc" fontSize={11} fontWeight={700}>
                    {String(name)}
                  </text>
                </g>
              );
            }}>
            <Tooltip
              content={
                <CustomTooltip
                  formatter={(value, name) => [
                    `${formatCurrency(Number(value))}`,
                    String(name),
                  ]}
                />
              }
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {classRows.map((row) => (
          <div key={row.key} className="rounded-lg border border-border/40 bg-background/40 p-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium">{row.label}</span>
              <span>{row.percentage.toFixed(2)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary/40">
              <div
                className="h-full rounded-full"
                style={{width: `${Math.min(100, row.percentage)}%`, backgroundColor: row.color}}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
