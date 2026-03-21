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
const PLAN_FEATURES_BY_KEY: Record<string, string[]> = {
  free: [],
  starter: [],
  pro: ['comparator'],
  'pro ai': ['comparator', 'ai_insights'],
  premium: ['comparator', 'ai_insights'],
};

type CurrentSubscriptionPayload = {
  hasSubscription?: boolean;
  status?: string;
  plan?: {
    _id?: string;
    name?: string;
    features?: string[];
    price?: number;
  } | null;
  subscription?: {
    status?: string;
    plan?: {
      _id?: string;
      name?: string;
      features?: string[];
      price?: number;
    } | null;
  } | null;
};

function normalizePlanName(name: string | undefined | null): string {
  return String(name || 'free')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function resolvePlanFeaturesFromName(normalizedPlanName: string): string[] {
  if (normalizedPlanName.includes('premium')) {
    return PLAN_FEATURES_BY_KEY.premium;
  }
  if (normalizedPlanName.includes('pro')) {
    return PLAN_FEATURES_BY_KEY.pro;
  }
  if (normalizedPlanName.includes('starter')) {
    return PLAN_FEATURES_BY_KEY.starter;
  }
  return PLAN_FEATURES_BY_KEY.free;
}

export function useSubscription() {
  const {data: subscription, isLoading} = useQuery<CurrentSubscriptionPayload>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await subscriptionService.getCurrentPlan();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const status =
    subscription?.subscription?.status || subscription?.status || 'inactive';
  const rawPlan =
    subscription?.plan || subscription?.subscription?.plan || null;
  const hasSubscriptionFlag = subscription?.hasSubscription;
  const hasAnySubscription =
    typeof hasSubscriptionFlag === 'boolean'
      ? hasSubscriptionFlag
      : Boolean(rawPlan || status === 'active' || status === 'trialing');

  const isSubscribed =
    hasAnySubscription && (status === 'active' || status === 'trialing');

  const planName = normalizePlanName(rawPlan?.name);
  const apiFeatures = Array.isArray(rawPlan?.features) ? rawPlan.features : [];
  const features =
    apiFeatures.length > 0 ? apiFeatures : resolvePlanFeaturesFromName(planName);

  /** Verifica se o plano atual inclui a feature solicitada */
  function hasFeature(feature: 'ai_insights' | 'comparator' | string): boolean {
    if (!isSubscribed) return false;
    if (features.includes(feature)) return true;
    if (feature === 'ai_insights' && planName.includes('premium')) return true;
    if (feature === 'comparator' && (planName.includes('premium') || planName.includes('pro'))) {
      return true;
    }
    return false;
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
