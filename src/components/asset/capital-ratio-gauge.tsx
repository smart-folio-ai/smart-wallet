export interface CapitalRatioGaugeProps {
  label: string;
  value: number | null;
  maxScale: number;
  dangerAbove?: number;
}

const NEUTRAL_COLOR = '#94a3b8';
const SAFE_COLOR = '#22c55e';
const DANGER_COLOR = '#f43f5e';

function arcPath(cx: number, cy: number, radius: number, startDeg: number, endDeg: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const startX = cx + radius * Math.cos(toRad(startDeg));
  const startY = cy - radius * Math.sin(toRad(startDeg));
  const endX = cx + radius * Math.cos(toRad(endDeg));
  const endY = cy - radius * Math.sin(toRad(endDeg));
  // sweep-flag 1: no SVG o eixo Y cresce para baixo, entao o arco que
  // sobe pela esquerda, passa pelo topo e desce a direita e o SENTIDO
  // HORARIO. Com 0 cada faixa curvava para o lado oposto e o medidor
  // virava um bico em vez de um semicirculo.
  return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
}

export function CapitalRatioGauge({label, value, maxScale, dangerAbove}: CapitalRatioGaugeProps) {
  // `==` proposital: o payload da API nao e tipado, entao `undefined` (campo
  // renomeado, objeto parcial de cache/proxy) precisa cair na mesma via de ausencia
  // que `null`, em vez de vazar para o caminho numerico e quebrar a pagina inteira.
  if (value == null) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        <span className="text-2xl font-black text-muted-foreground">—</span>
      </div>
    );
  }

  const cx = 120;
  const cy = 120;
  const radius = 88;
  const clamped = Math.max(0, Math.min(maxScale, value));
  const progress = clamped / maxScale;
  const rotateDeg = -90 + progress * 180;

  const dangerProgress =
    dangerAbove !== undefined ? Math.max(0, Math.min(1, dangerAbove / maxScale)) : null;
  // 180deg (esquerda) a 0deg (direita) percorre 0..maxScale. Segmento seguro
  // fica do inicio ate o ponto de dangerAbove; o resto e perigo.
  const dangerBoundaryDeg = dangerProgress !== null ? 180 - dangerProgress * 180 : null;

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative h-[112px] w-full flex items-end justify-center sm:h-[130px]">
        <svg
          viewBox="0 0 240 130"
          className="absolute bottom-0 h-[104px] w-[200px] overflow-visible sm:h-[120px] sm:w-[240px]">
          <path
            d={arcPath(cx, cy, radius, 180, 0)}
            stroke="hsl(var(--muted) / 0.2)"
            strokeWidth="26"
            fill="none"
            strokeLinecap="butt"
          />
          {dangerBoundaryDeg === null ? (
            <path
              d={arcPath(cx, cy, radius, 180, 0)}
              stroke={NEUTRAL_COLOR}
              strokeWidth="26"
              fill="none"
              strokeLinecap="butt"
            />
          ) : (
            <>
              <path
                d={arcPath(cx, cy, radius, 180, dangerBoundaryDeg)}
                stroke={SAFE_COLOR}
                strokeWidth="26"
                fill="none"
                strokeLinecap="butt"
              />
              <path
                d={arcPath(cx, cy, radius, dangerBoundaryDeg, 0)}
                stroke={DANGER_COLOR}
                strokeWidth="26"
                fill="none"
                strokeLinecap="butt"
              />
            </>
          )}
        </svg>
        <div
          data-testid="gauge-needle"
          className="absolute bottom-0 left-1/2 h-[90px] w-[3px] bg-slate-800 dark:bg-white origin-bottom rounded-full transition-transform duration-700"
          style={{transform: `translateX(-50%) rotate(${rotateDeg}deg)`}}
        />
        <div className="absolute bottom-[-6px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-slate-800 dark:bg-white" />
      </div>

      <div className="text-center mt-2 flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-70">
          {label}
        </span>
        <span className="text-2xl font-black">
          {value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%
        </span>
      </div>
    </div>
  );
}
