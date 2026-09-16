import type {UserPlanTier} from '@/interface/subscription';

/**
 * Patamares numéricos de HOJE (TRA-182). Não são uma lista fechada — o
 * admin cria um plano em qualquer nível (ex.: 15, entre Pro e Wealth) sem
 * mexer em código. O que ainda exige código é decidir, para uma feature
 * NOVA, a partir de qual nível ela libera.
 */
export const FREE_ACCESS_LEVEL: UserPlanTier = 0;
export const PRO_ACCESS_LEVEL: UserPlanTier = 10;
export const PREMIUM_ACCESS_LEVEL: UserPlanTier = 20;

/**
 * Fallback legado por NOME do plano — mesmo mapeamento de
 * `SubscriptionUserPlanResolver.tierFromPlanName` no server (a autorização
 * real continua lá). Só entra em jogo para um plano sem `accessLevel`
 * gravado ainda.
 */
export function tierFromPlanName(rawName: string | null | undefined): UserPlanTier {
  const name = String(rawName || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
  if (!name) return FREE_ACCESS_LEVEL;
  if (name.includes('enterprise') || name.includes('global') || name.includes('investor')) {
    return PREMIUM_ACCESS_LEVEL + 10;
  }
  if (name.includes('premium') || name.includes('wealth')) return PREMIUM_ACCESS_LEVEL;
  if (name.includes('pro')) return PRO_ACCESS_LEVEL;
  return FREE_ACCESS_LEVEL;
}

/**
 * Nível de acesso do plano: o campo `accessLevel` gravado no plano manda
 * (renomear o plano não muda o acesso); o nome só decide para planos
 * antigos sem o campo.
 */
export function tierOfPlan(
  plan: {accessLevel?: number | null; name?: string | null} | null | undefined,
): UserPlanTier {
  return typeof plan?.accessLevel === 'number' ? plan.accessLevel : tierFromPlanName(plan?.name);
}

/** Aceita um nível já resolvido ou, por compatibilidade, o nome do plano. */
export function toTier(value: UserPlanTier | string | null | undefined): UserPlanTier {
  return typeof value === 'number' ? value : tierFromPlanName(value);
}

export function planAtLeast(actual: UserPlanTier, required: UserPlanTier): boolean {
  return actual >= required;
}
