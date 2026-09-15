import {useQuery} from '@tanstack/react-query';
import {subscriptionService} from '@/server/api/api';
import {planAtLeast, tierFromPlanName} from '@/services/subscription/plan-tier';
import type {UserPlanTier} from '@/interface/subscription';

type CurrentSubscriptionPayload = {
  hasSubscription?: boolean;
  status?: string;
  currentPeriodEnd?: string;
  plan?: {
    _id?: string;
    name?: string;
    features?: string[];
    price?: number;
  } | null;
  subscription?: {
    status?: string;
    currentPeriodEnd?: string;
    plan?: {
      _id?: string;
      name?: string;
      features?: string[];
      price?: number;
    } | null;
  } | null;
};

const FEATURES_BY_TIER: Record<UserPlanTier, string[]> = {
  free: [],
  pro: ['comparator', 'broker_sync'],
  premium: ['comparator', 'broker_sync', 'ai_insights'],
  global_investor: ['comparator', 'broker_sync', 'ai_insights'],
};

/** Plano mínimo de cada feature paga (a checagem real é do server). */
const FEATURE_MIN_TIER: Record<string, UserPlanTier> = {
  comparator: 'pro',
  broker_sync: 'pro',
  ai_insights: 'premium',
};

function normalizePlanName(name: string | undefined | null): string {
  return String(name || 'free')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
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

  const hasSubscriptionFlag = subscription?.hasSubscription;
  const status =
    subscription?.subscription?.status ||
    subscription?.status ||
    (hasSubscriptionFlag ? 'active' : 'inactive');
  const rawPlan =
    subscription?.plan || subscription?.subscription?.plan || null;
  const rawPlanName = String(rawPlan?.name || 'Free');
  const hasAnySubscription =
    typeof hasSubscriptionFlag === 'boolean'
      ? hasSubscriptionFlag
      : Boolean(rawPlan || status === 'active' || status === 'trialing');

  const isSubscribed =
    hasAnySubscription && (status === 'active' || status === 'trialing');
  const planName = normalizePlanName(rawPlan?.name);
  const tier = tierFromPlanName(rawPlan?.name);
  const apiFeatures = Array.isArray(rawPlan?.features) ? rawPlan.features : [];
  const features =
    apiFeatures.length > 0
      ? apiFeatures
      : FEATURES_BY_TIER[tier];
  const currentPeriodEnd =
    subscription?.subscription?.currentPeriodEnd ||
    subscription?.currentPeriodEnd ||
    undefined;

  function hasFeature(feature: 'ai_insights' | 'comparator' | string): boolean {
    if (!isSubscribed) return false;
    if (features.includes(feature)) return true;
    const minTier = FEATURE_MIN_TIER[feature];
    return Boolean(minTier && planAtLeast(tier, minTier));
  }

  return {
    subscription,
    isLoading,
    isSubscribed,
    status,
    currentPeriodEnd,
    planName,
    tier,
    displayPlanName: rawPlanName,
    features,
    hasFeature,
    hasAiInsights: hasFeature('ai_insights'),
    hasComparator: hasFeature('comparator'),
    hasBrokerSync: hasFeature('broker_sync'),
  };
}
