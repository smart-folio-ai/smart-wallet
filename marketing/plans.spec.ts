import {describe, it, expect, vi, afterEach} from 'vitest';
import {selectPaidPlans, fetchPaidPlans} from './plans';

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

describe('fetchPaidPlans', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects instead of hanging forever when the API never responds', async () => {
    // Shorten the real timeout so the test doesn't actually wait 10s.
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(AbortSignal.timeout(20));

    // Simulate a hanging request: it only ever settles if its signal aborts.
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        });
      }),
    );

    await expect(fetchPaidPlans()).rejects.toThrow(/trakkerwallet\.com\.br/i);
  }, 2000);
});
