import {useQuery} from '@tanstack/react-query';
import {subscriptionService} from '@/server/api/api';
import {
  PREMIUM_ACCESS_LEVEL,
  PRO_ACCESS_LEVEL,
  planAtLeast,
  tierOfPlan,
} from '@/services/subscription/plan-tier';
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
    accessLevel?: number;
  } | null;
  subscription?: {
    status?: string;
    currentPeriodEnd?: string;
    plan?: {
      _id?: string;
      name?: string;
      features?: string[];
      price?: number;
      accessLevel?: number;
    } | null;
  } | null;
};

/**
 * Lista padrão de features quando o plano não tem `features` próprias
 * (plano antigo). Não é uma lista fechada por nome — é só o comportamento
 * de fallback para os dois patamares de hoje.
 */
function defaultFeaturesForLevel(level: UserPlanTier): string[] {
  if (level >= PREMIUM_ACCESS_LEVEL) return ['comparator', 'broker_sync', 'ai_insights'];
  if (level >= PRO_ACCESS_LEVEL) return ['comparator', 'broker_sync'];
  return [];
}

/** Nível mínimo de cada feature paga (a checagem real é do server). */
const FEATURE_MIN_TIER: Record<string, UserPlanTier> = {
  comparator: PRO_ACCESS_LEVEL,
  broker_sync: PRO_ACCESS_LEVEL,
  ai_insights: PREMIUM_ACCESS_LEVEL,
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
  const tier = tierOfPlan(rawPlan);
  const apiFeatures = Array.isArray(rawPlan?.features) ? rawPlan.features : [];
  const features =
    apiFeatures.length > 0
      ? apiFeatures
      : defaultFeaturesForLevel(tier);
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
