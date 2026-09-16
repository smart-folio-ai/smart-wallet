import {describe, it, expect} from 'vitest';
import {
  FREE_ACCESS_LEVEL,
  PREMIUM_ACCESS_LEVEL,
  PRO_ACCESS_LEVEL,
  planAtLeast,
  tierFromPlanName,
  tierOfPlan,
} from './plan-tier';
import {getAiPlanFromPlanName, isProOrHigherPlan} from '@/services/ai/trakkerAi';

const ENTERPRISE_ACCESS_LEVEL = PREMIUM_ACCESS_LEVEL + 10;

describe('plan tier (TRA-182 — nível numérico, sem lista fixa de nomes)', () => {
  it.each([
    ['Essencial', FREE_ACCESS_LEVEL],
    ['Pro', PRO_ACCESS_LEVEL],
    ['Wealth', PREMIUM_ACCESS_LEVEL],
    ['Wealth Premium', PREMIUM_ACCESS_LEVEL],
    ['Enterprise', ENTERPRISE_ACCESS_LEVEL],
    ['Global Investor', ENTERPRISE_ACCESS_LEVEL],
    ['', FREE_ACCESS_LEVEL],
  ])('maps %s to %s', (name, level) => {
    expect(tierFromPlanName(name)).toBe(level);
  });

  it('gives Enterprise every paid capability', () => {
    expect(planAtLeast(tierFromPlanName('Enterprise'), PREMIUM_ACCESS_LEVEL)).toBe(true);
    expect(isProOrHigherPlan('Enterprise', true)).toBe(true);
    expect(getAiPlanFromPlanName('Enterprise')).toBe('premium');
    expect(isProOrHigherPlan('Enterprise', false)).toBe(false);
  });

  it('accepts a custom level between the usual patamares, without any fixed name', () => {
    expect(planAtLeast(15, PRO_ACCESS_LEVEL)).toBe(true);
    expect(planAtLeast(15, PREMIUM_ACCESS_LEVEL)).toBe(false);
    expect(getAiPlanFromPlanName(15)).toBe('pro');
  });
});

describe('tierOfPlan', () => {
  it('uses the level stored on the plan so renaming keeps the access', () => {
    expect(tierOfPlan({name: 'Plano Ouro', accessLevel: PREMIUM_ACCESS_LEVEL})).toBe(
      PREMIUM_ACCESS_LEVEL,
    );
  });

  it('falls back to the name for older plans without accessLevel', () => {
    expect(tierOfPlan({name: 'Investidor Pro'})).toBe(PRO_ACCESS_LEVEL);
    expect(tierOfPlan(null)).toBe(FREE_ACCESS_LEVEL);
  });
});
