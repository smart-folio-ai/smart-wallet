import {describe, it, expect} from 'vitest';
import {buildScenarios, formatDuration, monthsToTarget, projectYearly} from './projection';

describe('planning projection', () => {
  it('compounds monthly on the real annual rate', () => {
    const values = projectYearly(1000, 0, 12, 2);
    expect(values).toHaveLength(3);
    expect(values[1]).toBeCloseTo(1120, 6);
    expect(values[2]).toBeCloseTo(1254.4, 6);
  });

  it('adds contributions at zero return', () => {
    expect(projectYearly(0, 100, 0, 1)[1]).toBeCloseTo(1200, 6);
  });

  it('orders scenarios conservative < expected < optimistic', () => {
    const s = buildScenarios(100000, 1000, 6.4, 20);
    expect(s.conservative[20]).toBeLessThan(s.expected[20]);
    expect(s.expected[20]).toBeLessThan(s.optimistic[20]);
  });

  it('finds the month the target is reached', () => {
    expect(monthsToTarget(0, 100, 0, 1200)).toBe(12);
    expect(monthsToTarget(5000, 0, 0, 1000)).toBe(0);
    expect(monthsToTarget(0, 0, 0, 1000)).toBeNull();
  });

  it('formats durations in Portuguese', () => {
    expect(formatDuration(31)).toBe('2 anos e 7 meses');
    expect(formatDuration(12)).toBe('1 ano');
    expect(formatDuration(5)).toBe('5 meses');
  });
});
