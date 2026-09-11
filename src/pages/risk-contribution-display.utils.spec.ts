import {describe, it, expect} from 'vitest';
import type {PortfolioRiskContribution} from '@/hooks/usePortfolioRiskContribution';
import {
  buildRiskRows,
  describeExcluded,
  describeRiskFooter,
  riskBarWidthPct,
} from './risk-contribution-display.utils';

const result = (
  rows: Array<[string, number, number]>,
  overrides: Partial<PortfolioRiskContribution> = {},
): PortfolioRiskContribution => ({
  rows: rows.map(([symbol, sharePct, weightPct]) => ({symbol, sharePct, weightPct})),
  observations: 240,
  portfolioVolatility: 0.128,
  missingSymbols: [],
  excludedValuePct: 0,
  truncated: false,
  ...overrides,
});

describe('buildRiskRows', () => {
  // `RISK_ROWS` do protótipo: cinco nomes e "Demais N".
  it('agrupa a cauda em "Demais N"', () => {
    const rows = buildRiskRows(
      result([
        ['PETR4', 19.4, 10.9],
        ['BTC', 16.1, 5.8],
        ['IVVB11', 12.8, 11.6],
        ['VALE3', 9.7, 4.1],
        ['WEGE3', 8.4, 6.9],
        ['ITUB4', 20, 30],
        ['BBAS3', 13.6, 30.7],
      ]),
    );

    expect(rows).toHaveLength(6);
    expect(rows[5].symbol).toBe('Demais 2');
    expect(rows[5].share).toBe('33,6%');
    expect(rows[5].weight).toBe('60,7%');
  });

  it('não agrupa quando cabe tudo', () => {
    expect(buildRiskRows(result([['A', 60, 50], ['B', 40, 50]]))).toHaveLength(2);
  });

  it('marca em --warn acima de 15%', () => {
    const rows = buildRiskRows(result([['A', 16, 50], ['B', 84, 50]]));
    expect(rows.map((row) => row.warn)).toEqual([true, true]);
    expect(buildRiskRows(result([['A', 14, 50]]))[0].warn).toBe(false);
  });

  it('vazio sem dado', () => {
    expect(buildRiskRows(undefined)).toEqual([]);
  });
});

describe('riskBarWidthPct', () => {
  it('segue o fator do protótipo e trava no trilho', () => {
    expect(riskBarWidthPct(10)).toBeCloseTo(34, 6);
    expect(riskBarWidthPct(50)).toBe(100);
  });
});

describe('describeRiskFooter', () => {
  const rows = buildRiskRows(
    result([
      ['PETR4', 19.4, 10.9],
      ['BTC', 16.1, 5.8],
      ['IVVB11', 64.5, 83.3],
    ]),
  );

  it('reproduz o rodapé do avançado', () => {
    expect(describeRiskFooter(rows, true)).toBe(
      'Dois nomes (PETR4 e BTC) respondem por 35,5% do VaR com 16,7% de peso. A concentração de risco é mais que o dobro da concentração de valor.',
    );
  });

  it('usa linguagem simples nos níveis base', () => {
    expect(describeRiskFooter(rows, false)).toBe(
      'PETR4 e BTC juntos movem 35,5% da sua carteira, somando 16,7% do valor investido.',
    );
  });

  it('não gera rodapé com menos de dois nomes', () => {
    expect(describeRiskFooter(buildRiskRows(result([['A', 100, 100]])), true)).toBeNull();
  });
});

describe('describeExcluded', () => {
  it('diz o que ficou fora da conta', () => {
    expect(
      describeExcluded(
        result([], {missingSymbols: ['BTC', 'ETH'], excludedValuePct: 5.8}),
      ),
    ).toBe('Fora da conta: 5,8% do valor (BTC, ETH), sem série diária de preço.');
  });

  it('não diz nada quando tudo foi medido', () => {
    expect(describeExcluded(result([]))).toBeNull();
  });
});
