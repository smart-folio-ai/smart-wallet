import {describe, it, expect} from 'vitest';
import {normalizePlanPricing} from './planPricing';

describe('normalizePlanPricing', () => {
  it('uses the real annualPrice when the backend provides one', () => {
    const result = normalizePlanPricing({price: 49, annualPrice: 411.6});
    expect(result).toEqual({
      monthlyPrice: 49,
      annualPrice: 411.6,
      hasRealAnnualPrice: true,
    });
  });

  it('falls back to the monthly price (no invented discount) when annualPrice is absent', () => {
    const result = normalizePlanPricing({price: 49});
    expect(result).toEqual({
      monthlyPrice: 49,
      annualPrice: 49,
      hasRealAnnualPrice: false,
    });
  });
});
