import {describe, it, expect} from 'vitest';
import {
  buildCalcRows,
  buildHistoryRows,
  darfCode,
  darfDueDate,
  latestMonth,
  type FiscalMonth,
} from './fiscal-summary';

const month = (overrides: Partial<FiscalMonth> = {}): FiscalMonth => ({
  year: 2026,
  month: 8,
  stockSales: 30000,
  stockProfit: 5000,
  fiiProfit: 0,
  cryptoProfit: 0,
  stockTax: 300,
  fiiTax: 0,
  cryptoTax: 0,
  totalTax: 300,
  stockExempt: false,
  stockCompensatedLoss: 3000,
  stockTaxableBase: 2000,
  fiiSales: 0,
  cryptoSales: 0,
  cryptoExempt: true,
  accumulatedLoss: 0,
  ...overrides,
});

const text = (value: string) => value.replace(/ /g, ' ');

describe('fiscal-summary', () => {
  it('dues the DARF on the last business day of the following month', () => {
    // agosto/2026: 30/09/2026 é quarta-feira.
    expect(darfDueDate({year: 2026, month: 8}).toDateString()).toBe(new Date(2026, 8, 30).toDateString());
    // janeiro/2026: 28/02/2026 é sábado, então volta para sexta 27/02.
    expect(darfDueDate({year: 2026, month: 1}).toDateString()).toBe(new Date(2026, 1, 27).toDateString());
    // dezembro vira janeiro do ano seguinte: 31/01/2027 é domingo, vence 29/01.
    expect(darfDueDate({year: 2026, month: 12}).toDateString()).toBe(new Date(2027, 0, 29).toDateString());
  });

  it('uses 4600 only when the tax comes from crypto alone', () => {
    expect(darfCode(month())).toBe('6015');
    expect(darfCode(month({stockTax: 0, cryptoTax: 150, totalTax: 150}))).toBe('4600');
  });

  it('builds the month calculation lines like the handoff', () => {
    const rows = buildCalcRows(month());

    expect(rows.map((row) => text(row.label))).toEqual([
      'Vendas de ações no mês',
      'Ganho líquido apurado',
      'Isenção de R$ 20.000,00 aplicada',
      'Prejuízo compensado',
      'Base de cálculo',
      'Imposto devido (15%)',
    ]);
    expect(text(rows[3].value)).toBe('− R$ 3.000,00');
    expect(rows[5]).toMatchObject({tone: 'total'});
    expect(text(rows[5].value)).toBe('R$ 300,00');
  });

  it('lists FII and crypto taxes separately when they exist', () => {
    const labels = buildCalcRows(month({fiiTax: 40, totalTax: 340})).map((row) => row.label);

    expect(labels).toContain('Imposto sobre FIIs (20%)');
    expect(labels[labels.length - 1]).toBe('Imposto devido no mês');
  });

  it('orders history newest first with the right status', () => {
    const rows = buildHistoryRows([
      month({month: 6, stockProfit: -1000, stockTax: 0, totalTax: 0, accumulatedLoss: 1000}),
      month({month: 7, stockSales: 5000, stockProfit: 800, stockTax: 0, totalTax: 0, stockExempt: true, accumulatedLoss: 1000}),
      month(),
    ]);

    expect(rows.map((row) => [row.month, row.status])).toEqual([
      ['ago/2026', 'A pagar'],
      ['jul/2026', 'Isento'],
      ['jun/2026', 'Prejuízo'],
    ]);
    expect(rows[1].darf).toBe('—');
    expect(latestMonth([month({month: 6}), month()])?.month).toBe(8);
  });
});
