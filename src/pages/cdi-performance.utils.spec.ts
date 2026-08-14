import {describe, it, expect} from 'vitest';
import {accumulateCdi} from './cdi-performance.utils';

describe('accumulateCdi', () => {
  it('starts the first point at zero, as the comparison origin', () => {
    const result = accumulateCdi([{date: '2026-07-01', value: 0.05}]);
    expect(result.get('2026-07-01')).toBeCloseTo(0, 10);
  });

  it('compounds daily rates rather than summing them', () => {
    const result = accumulateCdi([
      {date: '2026-07-01', value: 1},
      {date: '2026-07-02', value: 1},
      {date: '2026-07-03', value: 1},
    ]);

    // Composto a partir do segundo ponto: (1.01 * 1.01 - 1) * 100 = 2.01,
    // e não 2 como daria a soma.
    expect(result.get('2026-07-02')).toBeCloseTo(1, 6);
    expect(result.get('2026-07-03')).toBeCloseTo(2.01, 6);
  });

  it('returns an empty map for an empty series', () => {
    expect(accumulateCdi([]).size).toBe(0);
  });

  it('ignores non-numeric values without breaking the compounding', () => {
    const result = accumulateCdi([
      {date: '2026-07-01', value: 1},
      {date: '2026-07-02', value: 1},
      {date: '2026-07-03', value: Number.NaN},
      {date: '2026-07-04', value: 1},
    ]);

    expect(result.get('2026-07-04')).toBeCloseTo(2.01, 6);
  });

  it('orders by date before compounding', () => {
    const result = accumulateCdi([
      {date: '2026-07-03', value: 1},
      {date: '2026-07-01', value: 1},
      {date: '2026-07-02', value: 1},
    ]);

    expect(result.get('2026-07-03')).toBeCloseTo(2.01, 6);
  });
});
