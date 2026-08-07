import {useEffect, useRef} from 'react';
import gsap from 'gsap';

/**
 * Gráfico de linha desenhado à mão em SVG para o hero.
 * O traço "se desenha" via stroke-dashoffset animado com GSAP.
 *
 * O aria-label é conteúdo acessível e também é coberto por Landing.spec.tsx —
 * manter o texto "gráfico em alta".
 */
export function MarketChart() {
  const pathRef = useRef<SVGPathElement | null>(null);
  const areaRef = useRef<SVGPathElement | null>(null);

  const line =
    'M0,214 L62,198 L124,206 L186,170 L248,178 L310,138 L372,150 L434,104 L496,116 L558,64 L620,42';
  const area = `${line} L620,260 L0,260 Z`;

  useEffect(() => {
    const path = pathRef.current;
    const areaEl = areaRef.current;
    if (!path) return;

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const length = path.getTotalLength?.() ?? 0;

    // Sem motion: entrega o gráfico já desenhado.
    if (prefersReduced || !length) {
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '0';
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(path, {strokeDasharray: length, strokeDashoffset: length});
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 2.2,
        ease: 'power2.inOut',
        delay: 0.3,
      });
      if (areaEl) {
        gsap.fromTo(
          areaEl,
          {opacity: 0},
          {opacity: 1, duration: 1.4, delay: 1.2, ease: 'power1.out'},
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <svg
      viewBox="0 0 620 260"
      role="img"
      aria-label="Gráfico em alta da carteira nos últimos 30 dias"
      className="h-full w-full">
      <defs>
        <linearGradient id="tk-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--brand))" />
          <stop offset="100%" stopColor="hsl(var(--accent-positive))" />
        </linearGradient>
        <linearGradient id="tk-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--brand) / 0.22)" />
          <stop offset="100%" stopColor="hsl(var(--brand) / 0)" />
        </linearGradient>
      </defs>

      {/* grade de fundo */}
      {[52, 104, 156, 208].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="620"
          y2={y}
          stroke="hsl(var(--surface-hairline) / 0.05)"
          strokeWidth="1"
        />
      ))}

      <path ref={areaRef} d={area} fill="url(#tk-area)" />
      <path
        ref={pathRef}
        d={line}
        fill="none"
        stroke="url(#tk-line)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="620" cy="42" r="4" fill="hsl(var(--accent-positive))" />
      <circle cx="620" cy="42" r="9" fill="hsl(var(--accent-positive) / 0.2)" />
    </svg>
  );
}

export default MarketChart;
