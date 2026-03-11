import {useQuery} from '@tanstack/react-query';
import {subscriptionService} from '@/server/api/api';

export interface CurrentSubscription {
  plan: {
    _id: string;
    name: string;
    features: string[];
    price: number;
  };
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'paused';
  currentPeriodEnd: string;
  isActive: boolean;
}

/** Retorna true para features baseadas no nome do plano atual */
const PLAN_FEATURES: Record<string, string[]> = {
  free: [],
  starter: [],
  pro: ['comparator'],
  'pro ai': ['comparator', 'ai_insights'],
  premium: ['comparator', 'ai_insights'],
};

function normalizePlanName(name: string): string {
  return name.toLowerCase().trim();
}

export function useSubscription() {
  const {data: subscription, isLoading} = useQuery<CurrentSubscription>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await subscriptionService.getCurrentPlan();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const isSubscribed =
    subscription?.status === 'active' ||
    subscription?.status === 'trialing';

  const planName = normalizePlanName(subscription?.plan?.name ?? 'free');
  const features = PLAN_FEATURES[planName] ?? [];

  /** Verifica se o plano atual inclui a feature solicitada */
  function hasFeature(feature: 'ai_insights' | 'comparator' | string): boolean {
    if (!isSubscribed) return false;
    return features.includes(feature);
  }

  return {
    subscription,
    isLoading,
    isSubscribed,
    planName,
    hasFeature,
    /** Atalhos úteis */
    hasAiInsights: hasFeature('ai_insights'),
    hasComparator: hasFeature('comparator'),
  };
}
