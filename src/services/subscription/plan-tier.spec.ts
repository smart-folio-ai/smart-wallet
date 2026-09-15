import {describe, it, expect} from 'vitest';
import {planAtLeast, tierFromPlanName} from './plan-tier';
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
