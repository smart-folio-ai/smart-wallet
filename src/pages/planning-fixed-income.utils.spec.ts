import {describe, expect, it} from 'vitest';
import {calculateFixedIncomeComparison} from './planning-fixed-income.utils';

describe('planning fixed income comparator utils', () => {
  it('keeps lca tax free and applies tax to taxable scenarios', () => {
    const result = calculateFixedIncomeComparison({
      initialCapital: 100000,
      years: 4,
      annualInflationRate: 0.045,
      annualSelicRate: 0.105,
      annualPrefixRate: 0.14,
      annualIpcaSpreadRate: 0.065,
      annualSelicSpreadRate: 0.02,
      annualLcaRate: 0.125,
      taxableIrRate: 0.15,
    });

    const lca = result.find((s) => s.key === 'lca');
    const prefixado = result.find((s) => s.key === 'prefixado');

    expect(lca?.taxRate).toBe(0);
    expect(prefixado?.taxRate).toBe(0.15);
  });

  it('returns real values lower than nominal when inflation is positive', () => {
    const result = calculateFixedIncomeComparison({
      initialCapital: 50000,
      years: 3,
      annualInflationRate: 0.05,
      annualSelicRate: 0.11,
      annualPrefixRate: 0.13,
      annualIpcaSpreadRate: 0.06,
      annualSelicSpreadRate: 0.015,
      annualLcaRate: 0.12,
      taxableIrRate: 0.15,
    });

    for (const scenario of result) {
      expect(scenario.nominalFinalValue).toBeGreaterThanOrEqual(
        scenario.realFinalValue,
      );
    }
  });
});
