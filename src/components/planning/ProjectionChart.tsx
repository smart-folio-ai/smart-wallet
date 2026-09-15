import {useId} from 'react';

export interface ChartSeries {
  values: number[];
  color: string;
  width?: number;
  dash?: boolean;
}

/**
 * Gráfico de linhas do handoff (`lineChartEl`): grade, área sob a última série,
 * pontos no fim de cada linha e rótulos a cada `labelStep` pontos.
 */
export function ProjectionChart({series, labels, labelStep = 1, height = 226}: {series: ChartSeries[]; labels: string[]; labelStep?: number; height?: number}) {
  const gradientId = useId().replace(/:/g, '');
  const width = 640;
  const pad = 14;
  const all = series.flatMap((s) => s.values);
  if (!all.length) return null;
  const min = Math.min(...all);
  const span = Math.max(...all) - min || 1;
  const count = series[0].values.length;
  const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(count - 1, 1);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);
  const path = (values: number[]) => values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const main = series[series.length - 1];
  const area = `${path(main.values)} L${width - pad} ${height - pad} L${pad} ${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height + 22}`} style={{width: '100%', height: 'auto', display: 'block', overflow: 'visible'}} role="img" aria-label="Projeção de patrimônio">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ac)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--ac)" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={pad} x2={width - pad} y1={pad + f * (height - pad * 2)} y2={pad + f * (height - pad * 2)} stroke="rgba(var(--rgb-line),0.06)" strokeWidth={1} />
      ))}
      <path d={area} fill={`url(#${gradientId})`} />
      {series.map((s, i) => (
        <path key={i} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} strokeLinejoin="round" strokeDasharray={s.dash ? '3 5' : undefined} strokeLinecap={s.dash ? 'round' : undefined} />
      ))}
      {series.map((s, i) => (
        <circle key={`p${i}`} cx={x(s.values.length - 1)} cy={y(s.values[s.values.length - 1])} r={3.5} fill={s.color} stroke="var(--surf-2)" strokeWidth={2} />
      ))}
      {labels.map((label, i) => (
        <text key={label} x={x(i * labelStep)} y={height + 14} fill="var(--color-neutral-600)" fontSize={10.5} textAnchor="middle">
          {label}
        </text>
      ))}
    </svg>
  );
}
