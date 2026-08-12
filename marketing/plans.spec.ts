import {describe, it, expect} from 'vitest';
import {selectPaidPlans} from './plans';

const plan = (name: string, price: number, isActive = true) => ({
  _id: `id-${name}`,
  name,
  price,
  isActive,
});

describe('selectPaidPlans', () => {
  it('keeps only active paid plans, cheapest first', () => {
    expect(
      selectPaidPlans([
        plan('Premium', 24.9),
        plan('Free', 0),
        plan('Pro', 14.9),
      ]),
    ).toEqual([
      {name: 'Pro', price: 14.9},
      {name: 'Premium', price: 24.9},
    ]);
  });

  it('drops inactive plans', () => {
    expect(selectPaidPlans([plan('Pro', 14.9), plan('Antigo', 9.9, false)])).toEqual([
      {name: 'Pro', price: 14.9},
    ]);
  });

  it('keeps at most the three cheapest paid plans', () => {
    const selected = selectPaidPlans([
      plan('A', 10),
      plan('B', 20),
      plan('C', 30),
      plan('D', 40),
    ]);
    expect(selected.map((p) => p.name)).toEqual(['A', 'B', 'C']);
  });

  it('throws when there is no active paid plan', () => {
    expect(() => selectPaidPlans([plan('Free', 0)])).toThrow(/plano pago/i);
  });

  it('throws when the payload is not an array', () => {
    expect(() => selectPaidPlans({error: 'nope'})).toThrow(/resposta/i);
  });
});
