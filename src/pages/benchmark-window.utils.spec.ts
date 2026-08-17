import {describe, it, expect, vi, afterEach} from 'vitest';
import {
  filterHistoryByPeriod,
  brapiRangeForDays,
  getEffectiveHistoryWindow,
} from './benchmark-window.utils';

const daysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const toLocalIso = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

describe('filterHistoryByPeriod', () => {
  it('recorta pelo período nominal quando há pontos suficientes', () => {
    const history = [
      {date: daysAgo(60)},
      {date: daysAgo(20)},
      {date: daysAgo(5)},
      {date: daysAgo(1)},
    ];

    const filtered = filterHistoryByPeriod(history, '1M');

    expect(filtered).toHaveLength(3);
  });

  it('cai no histórico inteiro quando o recorte nominal deixa 1 ponto ou menos', () => {
    // Carteira antiga: só há um ponto dentro dos últimos 30 dias, mas o
    // histórico completo cobre 2 anos.
    const history = [{date: daysAgo(700)}, {date: daysAgo(400)}, {date: daysAgo(2)}];

    const filtered = filterHistoryByPeriod(history, '1M');

    expect(filtered).toBe(history);
    expect(filtered).toHaveLength(3);
  });
});

describe('getEffectiveHistoryWindow', () => {
  it('deriva a janela da primeira data efetivamente presente, não do período nominal', () => {
    // Mesmo cenário de fallback: janela nominal seria 30 dias, mas o
    // histórico real recuado cobre ~700 dias.
    const oldest = daysAgo(700);
    const history = [{date: oldest}, {date: daysAgo(2)}];

    const window = getEffectiveHistoryWindow(history);

    expect(window).not.toBeNull();
    expect(window!.days).toBeGreaterThanOrEqual(699);
    expect(window!.fromIso).toBe(toLocalIso(oldest));
  });

  it('retorna null para histórico vazio', () => {
    expect(getEffectiveHistoryWindow([])).toBeNull();
  });

  it('usa horário local, não UTC, para não deslocar a borda em UTC-3', () => {
    // 23:30 em horário local de um dia D corresponde a D+1 em UTC quando o
    // fuso é negativo (ex.: UTC-3). Usar toISOString() cru deslocaria essa
    // data para o dia seguinte.
    vi.setSystemTime(new Date('2026-01-15T12:00:00-03:00'));
    const localLateNight = new Date('2026-01-10T23:30:00-03:00');

    const window = getEffectiveHistoryWindow([{date: localLateNight}]);

    expect(window!.fromIso).toBe('2026-01-10');
    vi.useRealTimers();
  });
});

describe('brapiRangeForDays', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    [1, '5d'],
    [5, '5d'],
    [6, '1mo'],
    [30, '1mo'],
    [31, '3mo'],
    [90, '3mo'],
    [91, '6mo'],
    [180, '6mo'],
    [181, '1y'],
    [365, '1y'],
    [366, '5y'],
    [1825, '5y'],
  ])('mapeia %i dias para o bucket %s', (days, expected) => {
    expect(brapiRangeForDays(days)).toBe(expected);
  });
});
