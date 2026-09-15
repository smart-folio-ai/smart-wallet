import {describe, it, expect} from 'vitest';
import {planAtLeast, tierFromPlanName, tierOfPlan} from './plan-tier';
import {getAiPlanFromPlanName, isProOrHigherPlan} from '@/services/ai/trakkerAi';

describe('plan tier', () => {
  it.each([
    ['Essencial', 'free'],
    ['Pro', 'pro'],
    ['Wealth Premium', 'premium'],
    ['Enterprise', 'global_investor'],
    ['Global Investor', 'global_investor'],
    ['', 'free'],
  ])('maps %s to %s', (name, tier) => {
    expect(tierFromPlanName(name)).toBe(tier);
  });

  it('gives Enterprise every paid capability', () => {
    expect(planAtLeast(tierFromPlanName('Enterprise'), 'premium')).toBe(true);
    expect(isProOrHigherPlan('Enterprise', true)).toBe(true);
    expect(getAiPlanFromPlanName('Enterprise')).toBe('premium');
    expect(isProOrHigherPlan('Enterprise', false)).toBe(false);
  });
});

describe('tierOfPlan', () => {
  it('uses the tier stored on the plan so renaming keeps the access', () => {
    expect(tierOfPlan({name: 'Plano Ouro', tier: 'premium'})).toBe('premium');
  });

  it('falls back to the name for older plans without tier', () => {
    expect(tierOfPlan({name: 'Investidor Pro'})).toBe('pro');
    expect(tierOfPlan(null)).toBe('free');
  });
});
