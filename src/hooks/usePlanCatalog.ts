import {useMemo} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import SubscriptionService from '@/services/subscription';
import Profile from '@/services/profile';
import useAppToast from '@/hooks/use-app-toast';
import type {ISubscription} from '@/interface/subscription';
import {configUrlStripePaymentSuccessOrCancel} from '@/utils';
import {cancelUrl, successUrl} from '@/utils/env';
import {normalizePlanPricing} from '@/utils/planPricing';
import {formatCurrency} from '@/utils/formatters';
import {cumulativeFeatures} from '@/utils/planFeatures';
import {checkoutErrorMessage} from '@/services/subscription/checkout-error';

export type PricingPeriod = 'monthly' | 'annual';

export interface PlanColumn {
  plan: ISubscription;
  monthlyPrice: number;
  annualPrice: number;
  hasRealAnnualPrice: boolean;
}

export function priceLabel(column: PlanColumn, period: PricingPeriod): string {
  if (column.monthlyPrice <= 0) return 'Grátis';
  // Sem preço anual real no Stripe, mostra o mensal: nunca inventa desconto.
  if (period === 'annual' && column.hasRealAnnualPrice) return `${formatCurrency(column.annualPrice)}/ano`;
  return `${formatCurrency(column.monthlyPrice)}/mês`;
}

/** Planos vendáveis ordenados por preço, com recursos cumulativos por nível. */
export function usePlanCatalog() {
  const plansQuery = useQuery<ISubscription[]>({queryKey: ['plans'], queryFn: () => SubscriptionService.getPlans()});

  const columns = useMemo<PlanColumn[]>(
    () =>
      (plansQuery.data ?? [])
        .filter((plan) => plan.isActive || plan.isComingSoon)
        .map((plan) => ({plan, ...normalizePlanPricing(plan)}))
        .sort((a, b) => a.monthlyPrice - b.monthlyPrice),
    [plansQuery.data],
  );

  const discountBadge = useMemo(() => {
    const discounts = columns
      .filter((column) => column.hasRealAnnualPrice && column.monthlyPrice > 0)
      .map((column) => 1 - column.annualPrice / (column.monthlyPrice * 12));
    const best = Math.round(Math.max(0, ...discounts) * 100);
    return best > 0 ? `Economize ${best}%` : null;
  }, [columns]);

  const featuresByPlan = useMemo(() => cumulativeFeatures(columns.map((column) => column.plan)), [columns]);

  return {isLoading: plansQuery.isLoading, columns, discountBadge, featuresByPlan};
}

/** Abre o checkout do Stripe do plano no período escolhido. */
export function usePlanCheckout(period: PricingPeriod) {
  const toast = useAppToast();
  const checkout = useMutation({
    mutationFn: async (plan: ISubscription) => {
      const user = await Profile.getProfile();
      return SubscriptionService.createCheckoutSession(
        plan._id,
        user._id,
        configUrlStripePaymentSuccessOrCancel(successUrl),
        configUrlStripePaymentSuccessOrCancel(cancelUrl),
        period,
      );
    },
    onSuccess: (session) => {
      window.location.href = session.url;
    },
    onError: (error) => toast.error('Não foi possível iniciar o checkout', checkoutErrorMessage(error)),
  });

  const subscribe = (plan: ISubscription) => {
    if (plan.isComingSoon || !plan.isActive) {
      toast.info?.('Em breve', 'Este plano estará disponível em breve.');
      return;
    }
    checkout.mutate(plan);
  };

  const isOpening = (plan: ISubscription) => checkout.isPending && checkout.variables?._id === plan._id;

  return {subscribe, isPending: checkout.isPending, isOpening};
}
