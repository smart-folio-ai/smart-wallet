import {describe, expect, it} from 'vitest';
import {
  filterAndSortStockSuggestions,
  normalizeStockSymbol,
} from './stock-autocomplete.utils';

describe('stock-autocomplete utils', () => {
  const stocks = [
    {stock: 'VALE3', name: 'Vale', close: 1, change: 0},
    {stock: 'PETR4', name: 'Petrobras', close: 1, change: 0},
    {stock: 'PETR3', name: 'Petrobras ON', close: 1, change: 0},
  ];

  it('prioritizes exact symbol match', () => {
    const result = filterAndSortStockSuggestions(stocks, 'PETR4', 7);
    expect(result[0].stock).toBe('PETR4');
  });

  it('returns prefix matches before generic contains', () => {
    const result = filterAndSortStockSuggestions(stocks, 'PET', 7);
    expect(result.map((item) => item.stock)).toEqual(
      expect.arrayContaining(['PETR4', 'PETR3']),
    );
  });

  it('normalizes .SA suffix to keep exact-match ranking stable', () => {
    const result = filterAndSortStockSuggestions(
      [{stock: 'VALE3.SA', name: 'Vale', close: 1, change: 0}, ...stocks],
      'VALE3',
      7,
    );
    expect(result[0].stock).toBe('VALE3.SA');
    expect(normalizeStockSymbol(result[0].stock)).toBe('VALE3');
  });
});
