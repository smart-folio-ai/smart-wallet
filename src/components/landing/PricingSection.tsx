import {Link} from 'react-router-dom';
import {Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {planItems} from './landing-data';
import {useGsapParallax} from './motion/useGsapReveal';

export function PricingSection() {
  const auraRef = useGsapParallax<HTMLDivElement>(-50);

  return (
    <section id="planos" className="relative overflow-hidden py-24">
      <div
        ref={auraRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-50 blur-[130px]"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--brand) / 0.22) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            data-reveal
            className="font-heading text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            Planos que acompanham sua operação
          </h2>
          <p
            data-reveal
            data-reveal-delay="0.08"
            className="mt-4 text-lg leading-relaxed text-on-surface-muted/70">
            Comece grátis e evolua quando a carteira exigir mais inteligência.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {planItems.map((plan, index) => (
            <Card
              key={plan.name}
              data-reveal
              data-reveal-delay={String(index * 0.1)}
              className={`relative flex flex-col backdrop-blur-sm transition-all duration-300 ${
                plan.featured
                  ? 'border-brand/40 bg-gradient-to-b from-brand/15 to-surface-raised/70 shadow-2xl shadow-brand/20 lg:-translate-y-3'
                  : 'border-brand/15 bg-surface-raised/60 hover:-translate-y-1 hover:border-brand/25'
              }`}>
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-xs font-semibold text-brand-foreground shadow-lg shadow-brand/40">
                  Mais escolhido
                </span>
              )}

              <CardContent className="flex flex-1 flex-col p-7">
                <h3 className="font-heading text-lg font-semibold text-on-surface">
                  {plan.name}
                </h3>
                <p className="mt-2 min-h-[40px] text-sm text-on-surface-muted/70">
                  {plan.detail}
                </p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-on-surface">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-on-surface-muted/60">
                      {plan.period}
                    </span>
                  )}
                </div>

                <p className="mt-5 rounded-lg border border-brand/15 bg-brand/10 px-4 py-3 text-xs leading-relaxed text-on-surface-accent">
                  {plan.aiPillar}
                </p>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span className="text-sm leading-relaxed text-on-surface-muted/75">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  className={`mt-7 w-full ${
                    plan.featured
                      ? 'bg-brand text-brand-foreground shadow-lg shadow-brand/30 hover:bg-brand-strong'
                      : 'border border-brand/25 bg-transparent text-on-surface hover:bg-brand/10'
                  }`}>
                  <Link to={plan.href}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
