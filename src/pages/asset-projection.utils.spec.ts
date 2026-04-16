import {describe, expect, it} from 'vitest';
import {
  calculateAssetProjection,
  getDefaultProjectionAnnualReturn,
  getDefaultProjectionTaxRate,
} from './asset-projection.utils';

describe('asset projection utils', () => {
  it('calculates projection with monthly contribution and tax on gains', () => {
    const result = calculateAssetProjection({
      currentValue: 10000,
      monthlyContribution: 100,
      years: 5,
      annualReturnRate: 0.14,
      annualInflationRate: 0.045,
      taxRate: 0.15,
    });

    expect(result.totalContributed).toBe(16000);
    expect(result.grossFinalValue).toBeGreaterThan(result.totalContributed);
    expect(result.netFinalValue).toBeLessThan(result.grossFinalValue);
    expect(result.nominalProfitAfterTax).toBeGreaterThan(0);
  });

  it('keeps values stable when years is zero', () => {
    const result = calculateAssetProjection({
      currentValue: 5000,
      monthlyContribution: 200,
      years: 0,
      annualReturnRate: 0.12,
      annualInflationRate: 0.04,
      taxRate: 0.15,
    });

    expect(result.totalContributed).toBe(5000);
    expect(result.netFinalValue).toBe(5000);
    expect(result.nominalProfitAfterTax).toBe(0);
  });

  it('returns deterministic defaults by asset type', () => {
    expect(getDefaultProjectionAnnualReturn('stock')).toBe(0.14);
    expect(getDefaultProjectionAnnualReturn('crypto')).toBe(0.18);
    expect(getDefaultProjectionAnnualReturn('fund')).toBe(0.105);

    expect(getDefaultProjectionTaxRate('fii')).toBe(0.2);
    expect(getDefaultProjectionTaxRate('stock')).toBe(0.15);
  });
});
