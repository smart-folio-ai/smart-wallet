import {Link} from 'react-router-dom';
import {ArrowRight, Sparkles, TrendingUp} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {MarketChart} from './MarketChart';
import {returnCards} from './landing-data';
import {useGsapParallax} from './motion/useGsapReveal';

export function HeroSection() {
  const glowRef = useGsapParallax<HTMLDivElement>(70);

  return (
    <section id="inicio" className="relative overflow-hidden pt-32 pb-20">
      {/* aura de fundo */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 rounded-full opacity-60 blur-[120px]"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--brand) / 0.28) 0%, transparent 68%)',
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        {/* coluna esquerda */}
        <div>
          <span
            data-reveal
            className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-4 py-1.5 text-xs font-medium text-on-surface-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Inteligência aplicada a investimentos
          </span>

          <h1
            data-reveal
            data-reveal-delay="0.08"
            className="mt-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
            Seu terminal de mercado para decidir mais rápido e melhor
          </h1>

          <p
            data-reveal
            data-reveal-delay="0.16"
            className="mt-6 max-w-xl text-lg leading-relaxed text-on-surface-muted/75">
            Carteira, fiscal, RI e comparador num só lugar — com IA que aponta o
            que exige sua atenção agora, não mais um relatório para interpretar.
          </p>

          <div
            data-reveal
            data-reveal-delay="0.24"
            className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group bg-brand text-brand-foreground shadow-xl shadow-brand/30 transition-all hover:bg-brand-strong hover:shadow-brand/50">
              <Link to="/register">
                Começar gratuitamente
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-brand/25 bg-transparent text-on-surface hover:bg-brand/10 hover:text-on-surface">
              <Link to="/signin">Já tenho conta</Link>
            </Button>
          </div>

          {/* KPIs */}
          <dl
            data-reveal
            data-reveal-delay="0.32"
            className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {returnCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-brand/15 bg-surface-raised/60 px-4 py-3 backdrop-blur-sm">
                <dt className="text-xs text-on-surface-muted/60">
                  {card.label}
                </dt>
                <dd className="mt-1 flex items-center gap-1.5 font-heading text-xl font-semibold text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                  {card.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* coluna direita — painel */}
        <div data-reveal data-reveal-delay="0.2" className="relative">
          <div className="rounded-2xl border border-brand/15 bg-surface-raised/70 p-6 shadow-2xl shadow-brand/10 backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-heading text-sm font-semibold text-on-surface">
                  Trackerr Index
                </p>
                <p className="text-xs text-on-surface-muted/60">
                  Performance consolidada · 30 dias
                </p>
              </div>
              <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                ao vivo
              </span>
            </div>

            <div className="h-56">
              <MarketChart />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-brand/10 pt-5">
              <div>
                <p className="text-xs text-on-surface-muted/60">Patrimônio</p>
                <p className="font-heading text-base font-semibold text-on-surface">
                  R$ 284.930
                </p>
              </div>
              <div>
                <p className="text-xs text-on-surface-muted/60">Posições</p>
                <p className="font-heading text-base font-semibold text-on-surface">
                  27
                </p>
              </div>
              <div>
                <p className="text-xs text-on-surface-muted/60">Risco</p>
                <p className="font-heading text-base font-semibold text-amber-400">
                  Moderado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
