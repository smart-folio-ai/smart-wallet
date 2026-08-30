import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Check} from '@/components/ui/icons';
import {Button} from '@/components/ui/button';
import {Section} from '../ui/Section';
import {GlassPanel} from '../ui/GlassPanel';
import {PurchaseIntentModal} from '../PurchaseIntentModal';
import SubscriptionService from '@/services/subscription';
import {normalizePlanPricing} from '@/utils/planPricing';
import {formatCurrency} from '@/utils/formatters';

type LandingPlan = {
  id: string;
  name: string;
  price: string;
  period?: string;
  detail: string;
  aiPillar: string;
  cta: string;
  isFree: boolean;
  featured: boolean;
  comingSoon: boolean;
  benefits: string[];
};

const GRID_COLUMNS_BY_COUNT: Record<number, string> = {
  1: 'md:grid-cols-2',
  2: 'md:grid-cols-2',
  3: 'lg:grid-cols-3',
};

function gridColumnsFor(count: number): string {
  return GRID_COLUMNS_BY_COUNT[count] ?? 'md:grid-cols-2 xl:grid-cols-4';
}

export function PricingSection() {
  const [modalPlan, setModalPlan] = useState<{id: string; name: string} | null>(
    null,
  );

  const {
    data: plans,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['landing-plans'],
    queryFn: () => SubscriptionService.getPlans(),
    retry: false,
  });

  const sortedPlans = [...(plans ?? [])]
    .filter((plan) => plan.isActive)
    .sort((a, b) => a.price - b.price);

  const featuredIndex = sortedPlans.findIndex(
    (plan) => plan.isFeatured === true,
  );

  const landingPlans: LandingPlan[] = sortedPlans.map((plan, index) => {
    const {monthlyPrice} = normalizePlanPricing(plan);
    const isFree = monthlyPrice === 0;
    const comingSoon = plan.isComingSoon === true;
    const [highlight, ...restBenefits] = plan.features;

    return {
      id: plan._id,
      name: plan.name,
      price: isFree ? 'Grátis' : formatCurrency(monthlyPrice, plan.currency),
      period: isFree ? undefined : '/mês',
      detail: plan.description,
      aiPillar: highlight ?? '',
      cta: comingSoon
        ? 'Em breve'
        : isFree
          ? 'Começar grátis'
          : `Assinar ${plan.name}`,
      isFree,
      featured: index === featuredIndex,
      comingSoon,
      benefits: restBenefits,
    };
  });

  const renderPlanCard = (plan: LandingPlan, index: number) => (
    <GlassPanel
      key={plan.id}
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

      {plan.comingSoon ? (
        <Button
          type="button"
          size="lg"
          disabled
          className="mt-8 w-full border border-surface-hairline/[0.12] bg-transparent text-on-surface-muted/50">
          {plan.cta}
        </Button>
      ) : plan.isFree ? (
        <Button
          asChild
          size="lg"
          className={`mt-8 w-full ${
            plan.featured
              ? 'border border-brand bg-transparent text-brand hover:bg-brand/10 transition-colors'
              : 'border border-surface-hairline/[0.12] bg-transparent text-on-surface hover:bg-surface-hairline/[0.06]'
          }`}>
          <Link to="/register">{plan.cta}</Link>
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          onClick={() => setModalPlan({id: plan.id, name: plan.name})}
          className={`mt-8 w-full ${
            plan.featured
              ? 'border border-brand bg-transparent text-brand hover:bg-brand/10 transition-colors'
              : 'border border-surface-hairline/[0.12] bg-transparent text-on-surface hover:bg-surface-hairline/[0.06]'
          }`}>
          {plan.cta}
        </Button>
      )}
    </GlassPanel>
  );

  return (
    <Section id="planos">
      <div className="mx-auto max-w-2xl text-center">
        <h2
          data-reveal
          className="font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          Comece grátis. Pague quando fizer diferença.
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.08"
          className="mt-5 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          Sem cartão para começar e sem prazo de expiração no plano grátis.
        </p>
      </div>

      <div
        className={`mt-16 grid items-start gap-5 ${gridColumnsFor(
          landingPlans.length,
        )}`}>
        {isLoading && (
          <div
            data-testid="pricing-plans-loading"
            className="col-span-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-surface-hairline/[0.07] bg-surface-hairline/[0.03] p-7 text-center">
            <p className="text-sm text-on-surface-muted/70">
              Carregando planos...
            </p>
          </div>
        )}

        {!isLoading && isError && (
          <div
            data-testid="pricing-plans-error"
            className="col-span-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-surface-hairline/[0.07] bg-surface-hairline/[0.03] p-7 text-center">
            <p className="text-sm text-on-surface-muted/70">
              Não foi possível carregar os planos agora.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!isLoading && !isError && landingPlans.length === 0 && (
          <div
            data-testid="pricing-plans-empty"
            className="col-span-full flex flex-col items-center justify-center gap-2 rounded-2xl border border-surface-hairline/[0.07] bg-surface-hairline/[0.03] p-7 text-center">
            <p className="text-sm text-on-surface-muted/70">
              Nenhum plano disponível no momento.
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          landingPlans.map((plan, index) => renderPlanCard(plan, index))}
      </div>

      <PurchaseIntentModal
        open={modalPlan !== null}
        onOpenChange={(open) => {
          if (!open) setModalPlan(null);
        }}
        planId={modalPlan?.id ?? ''}
        planName={modalPlan?.name ?? ''}
      />
    </Section>
  );
}

export default PricingSection;
