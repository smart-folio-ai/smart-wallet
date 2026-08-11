import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Section} from '../ui/Section';
import {Eyebrow} from '../ui/Eyebrow';
import {GlassPanel} from '../ui/GlassPanel';
import {PurchaseIntentModal} from '../PurchaseIntentModal';
import SubscriptionService from '@/services/subscription';
import {normalizePlanPricing} from '@/utils/planPricing';

const BASICO_PLAN = {
  name: 'Básico',
  price: 'Grátis',
  detail: 'Para organizar a carteira e enxergar o conjunto',
  aiPillar: 'Consolidação completa, sem limite de corretoras',
  cta: 'Começar grátis',
  href: '/register',
  featured: false,
  benefits: [
    'Até 10 ativos',
    'Consolidação de todas as corretoras',
    'Alocação por ativo, setor e classe',
    'Acompanhamento de proventos',
  ],
};

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function PricingSection() {
  const [modalPlanName, setModalPlanName] = useState<string | null>(null);

  const {data: plans} = useQuery({
    queryKey: ['landing-plans'],
    queryFn: () => SubscriptionService.getPlans(),
    retry: false,
  });

  const paidPlans = (plans ?? [])
    .filter((plan) => plan.isActive)
    .map((plan, index) => {
      const {monthlyPrice} = normalizePlanPricing(plan);
      return {
        name: plan.name,
        price: formatCurrency(monthlyPrice),
        period: '/mês',
        detail: plan.description,
        aiPillar: plan.features[0] ?? '',
        cta: `Assinar ${plan.name}`,
        featured: index === 0,
        benefits: plan.features,
      };
    });

  const allPlans = [BASICO_PLAN, ...paidPlans];

  return (
    <Section id="planos">
      <div className="mx-auto max-w-2xl text-center">
        <div data-reveal>
          <Eyebrow>Planos</Eyebrow>
        </div>
        <h2
          data-reveal
          data-reveal-delay="0.08"
          className="mt-6 font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          Comece grátis. Pague quando fizer diferença.
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.14"
          className="mt-5 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          Sem cartão para começar e sem prazo de expiração no plano grátis.
        </p>
      </div>

      <div className="mt-16 grid items-start gap-5 lg:grid-cols-3">
        {allPlans.map((plan, index) => (
          <GlassPanel
            key={plan.name}
            data-reveal
            data-reveal-delay={String(index * 0.1)}
            className={`relative flex flex-col p-7 transition-transform duration-300 ${
              plan.featured
                ? 'border-brand/30 lg:-translate-y-2'
                : 'hover:-translate-y-1'
            }`}>
            {plan.featured && (
              <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground">
                Mais escolhido
              </span>
            )}

            <h3 className="font-heading text-base font-semibold text-on-surface">
              {plan.name}
            </h3>
            <p className="mt-2 min-h-[40px] text-sm leading-relaxed text-on-surface-muted/55">
              {plan.detail}
            </p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-heading text-4xl font-bold tracking-[-0.02em] tabular-nums text-on-surface">
                {plan.price}
              </span>
              {plan.period && (
                <span className="text-sm text-on-surface-muted/50">
                  {plan.period}
                </span>
              )}
            </div>

            <p className="mt-6 rounded-xl border border-surface-hairline/[0.07] bg-surface-hairline/[0.03] px-4 py-3 text-xs leading-relaxed text-on-surface-muted/70">
              {plan.aiPillar}
            </p>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
                  <span className="text-sm leading-relaxed text-on-surface-muted/65">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>

            {plan.name === BASICO_PLAN.name ? (
              <Button
                asChild
                size="lg"
                className={`mt-8 w-full ${
                  plan.featured
                    ? 'bg-brand text-brand-foreground hover:bg-brand-strong'
                    : 'border border-surface-hairline/[0.12] bg-transparent text-on-surface hover:bg-surface-hairline/[0.06]'
                }`}>
                <Link to={BASICO_PLAN.href}>{plan.cta}</Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={() => setModalPlanName(plan.name)}
                className={`mt-8 w-full ${
                  plan.featured
                    ? 'bg-brand text-brand-foreground hover:bg-brand-strong'
                    : 'border border-surface-hairline/[0.12] bg-transparent text-on-surface hover:bg-surface-hairline/[0.06]'
                }`}>
                {plan.cta}
              </Button>
            )}
          </GlassPanel>
        ))}
      </div>

      <PurchaseIntentModal
        open={modalPlanName !== null}
        onOpenChange={(open) => {
          if (!open) setModalPlanName(null);
        }}
        planName={modalPlanName ?? ''}
      />
    </Section>
  );
}

export default PricingSection;
