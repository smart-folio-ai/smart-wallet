import {useLayoutEffect, useRef} from 'react';
import {Link} from 'react-router-dom';
import gsap from 'gsap';
import {ArrowRight} from '@/components/ui/icons';
import {Button} from '@/components/ui/button';
import {GlassPanel} from '../ui/GlassPanel';
import {GridBackdrop} from '../ui/GridBackdrop';
import {Ticker} from '../ui/Ticker';
import {MarketChart} from '../MarketChart';
import {heroCopy, heroPanel} from '../landing-data';
import {useMagnetic} from '../motion/useMagnetic';
import {useGsapParallax} from '../motion/useGsapReveal';

const currency = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(n);

export function HeroSection() {
  const rootRef = useRef<HTMLElement | null>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.2);
  const gridRef = useGsapParallax<HTMLDivElement>(30);

  // Timeline de entrada. Não usa ScrollTrigger: o hero já está na viewport
  // no primeiro paint, então a cascata roda no mount.
  // useLayoutEffect (não useEffect) para aplicar o estado "from" (opacity:0)
  // antes do browser pintar — senão o hero pisca um frame já totalmente
  // visível antes de ser resetado e reanimado.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({defaults: {ease: 'power3.out', duration: 0.7}})
        .from('[data-hero="line"]', {opacity: 0, y: 24, stagger: 0.1})
        .from('[data-hero="sub"]', {opacity: 0, y: 16}, '-=0.4')
        .from('[data-hero="ctas"]', {opacity: 0, y: 16}, '-=0.45')
        .from('[data-hero="proof"]', {opacity: 0, y: 12}, '-=0.5')
        .from(
          '[data-hero="panel"]',
          {opacity: 0, y: 32, rotateX: 6, transformPerspective: 900},
          '-=0.8',
        );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="inicio"
      className="relative overflow-hidden pb-24 pt-36 sm:pb-32">
      <div ref={gridRef} className="absolute inset-0">
        <GridBackdrop />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:px-8">
        <div>
          <h1 className="font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(2.5rem,6vw,4.5rem)] [line-height:0.98]">
            <span data-hero="line" className="block">
              {heroCopy.title}
            </span>
            <span
              data-hero="line"
              className="block text-on-surface-muted/45">
              {heroCopy.titleAccent}
            </span>
          </h1>

          <p
            data-hero="sub"
            className="mt-7 max-w-xl text-[1.0625rem] leading-[1.7] text-on-surface-muted/65">
            {heroCopy.subtitle}
          </p>

          <div
            data-hero="ctas"
            className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group border border-brand bg-transparent text-brand hover:bg-brand/10 transition-colors">
              <Link ref={ctaRef} to={heroCopy.primaryCta.href}>
                {heroCopy.primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-surface-hairline/[0.12] bg-transparent text-on-surface hover:bg-surface-hairline/[0.06] hover:text-on-surface">
              <a href={heroCopy.secondaryCta.href}>
                {heroCopy.secondaryCta.label}
              </a>
            </Button>
          </div>

          <ul
            data-hero="proof"
            className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            {heroCopy.microProof.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-on-surface-muted/50">
                <span className="h-1 w-1 rounded-full bg-positive" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div data-hero="panel">
          <GlassPanel className="p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="font-heading text-sm font-semibold text-on-surface">
                  {heroPanel.title}
                </p>
                <p className="mt-1 text-xs text-on-surface-muted/50">
                  {heroPanel.subtitle}
                </p>
              </div>
              <span className="flex items-center gap-2 rounded-full border border-positive/20 bg-positive/10 px-3 py-1 text-xs font-medium text-positive">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-75 motion-reduce:animate-none" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-positive" />
                </span>
                ao vivo
              </span>
            </div>

            <div className="h-52">
              <MarketChart />
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-surface-hairline/[0.07] pt-5">
              {heroPanel.kpis.map((kpi) => (
                <div key={kpi.label}>
                  <dt className="text-xs text-on-surface-muted/50">
                    {kpi.label}
                  </dt>
                  <dd className="mt-1.5 font-heading text-lg font-semibold text-positive">
                    <Ticker
                      value={kpi.value}
                      format={(n) => `+${n.toFixed(2).replace('.', ',')}`}
                    />
                    {kpi.suffix}
                  </dd>
                </div>
              ))}
            </dl>

            <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-surface-hairline/[0.07] pt-5">
              <div>
                <dt className="text-xs text-on-surface-muted/50">Patrimônio</dt>
                <dd className="mt-1 font-heading text-base font-semibold tabular-nums text-on-surface">
                  {currency(heroPanel.equity)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-muted/50">Posições</dt>
                <dd className="mt-1 font-heading text-base font-semibold tabular-nums text-on-surface">
                  {heroPanel.positions}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-on-surface-muted/50">Risco</dt>
                <dd className="mt-1 font-heading text-base font-semibold text-on-surface">
                  {heroPanel.risk}
                </dd>
              </div>
            </dl>
          </GlassPanel>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
