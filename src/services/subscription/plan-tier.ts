import type {UserPlanTier} from '@/interface/subscription';

/** Ordem de acesso, igual a `PLAN_RANK` do server. */
const PLAN_RANK: Record<UserPlanTier, number> = {free: 0, pro: 1, premium: 2, global_investor: 3};

/**
 * Mesmo mapeamento de `SubscriptionUserPlanResolver.tierFromPlanName` no
 * server (a autorização real continua lá). Casa por substring porque o nome
 * é editável no admin/Stripe; o tier mais alto é checado primeiro.
 */
export function tierFromPlanName(rawName: string | null | undefined): UserPlanTier {
  const name = String(rawName || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
  if (!name) return 'free';
  if (name.includes('enterprise') || name.includes('global') || name.includes('investor')) return 'global_investor';
  if (name.includes('premium')) return 'premium';
  if (name.includes('pro')) return 'pro';
  return 'free';
}

export function planAtLeast(actual: UserPlanTier, required: UserPlanTier): boolean {
  return PLAN_RANK[actual] >= PLAN_RANK[required];
}
