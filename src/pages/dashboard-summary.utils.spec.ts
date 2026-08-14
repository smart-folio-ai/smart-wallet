import {describe, it, expect} from 'vitest';
import {
  getAveragePrice,
  computePnl,
  computeReturnSinceAvgPrice,
} from './dashboard-summary.utils';

describe('getAveragePrice', () => {
  it('reads avgPrice, the field the backend actually returns', () => {
    expect(getAveragePrice({avgPrice: 12.5})).toBe(12.5);
  });

  it('still accepts the legacy names as a fallback', () => {
    expect(getAveragePrice({averagePrice: 9})).toBe(9);
    expect(getAveragePrice({average_price: 8})).toBe(8);
  });

  it('prefers avgPrice when more than one is present', () => {
    expect(getAveragePrice({avgPrice: 12.5, averagePrice: 9})).toBe(12.5);
    expect(
      getAveragePrice({avgPrice: 12.5, averagePrice: 9, average_price: 8}),
    ).toBe(12.5);
  });

  it('returns 0 for a missing or malformed asset', () => {
    expect(getAveragePrice(null)).toBe(0);
    expect(getAveragePrice(undefined)).toBe(0);
    expect(getAveragePrice({})).toBe(0);
  });
});

describe('computePnl', () => {
  it('computes profit and percentage from a real cost basis', () => {
    expect(computePnl(150, 100)).toEqual({pnl: 50, pnlPercentage: 50});
  });

  it('handles a loss', () => {
    expect(computePnl(80, 100)).toEqual({pnl: -20, pnlPercentage: -20});
  });

  it('returns null for both when there is no cost basis', () => {
    expect(computePnl(11933.23, 0)).toEqual({
      pnl: null,
      pnlPercentage: null,
    });
  });

  it('returns null rather than treating a negative cost as valid', () => {
    expect(computePnl(100, -5)).toEqual({pnl: null, pnlPercentage: null});
  });
});

describe('computeReturnSinceAvgPrice', () => {
  it('computes the return since average cost for a single asset, not a period change', () => {
    // 10 shares bought at avgPrice 20 -> cost basis 200; now worth 250.
    expect(
      computeReturnSinceAvgPrice({avgPrice: 20, quantity: 10}, 250),
    ).toBe(25);
  });

  it('handles a loss relative to the average price', () => {
    expect(computeReturnSinceAvgPrice({avgPrice: 20, quantity: 10}, 150)).toBe(
      -25,
    );
  });

  it('returns 0 when there is no cost basis', () => {
    expect(computeReturnSinceAvgPrice({avgPrice: 0, quantity: 10}, 100)).toBe(
      0,
    );
    expect(computeReturnSinceAvgPrice(null, 100)).toBe(0);
    expect(computeReturnSinceAvgPrice(undefined, 100)).toBe(0);
  });
});
