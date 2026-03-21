import {beforeEach, describe, expect, it, vi} from 'vitest';

const {analyzeMock} = vi.hoisted(() => ({
  analyzeMock: vi.fn(),
}));

vi.mock('@/services/ai', () => ({
  aiAnalysisService: {
    analyze: analyzeMock,
    chat: vi.fn(),
  },
}));

import {
  buildAiCacheSignature,
  deriveDashboardHighlights,
  getAiPlanFromPlanName,
  getOrCreateAiAnalysis,
  isProOrHigherPlan,
} from './trakkerAi';

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

describe('trakkerAi service helpers', () => {
  beforeEach(() => {
    analyzeMock.mockReset();
    vi.stubGlobal('localStorage', createLocalStorageMock());
  });

  it('resolve plano de IA corretamente', () => {
    expect(getAiPlanFromPlanName('Investidor Premium')).toBe('premium');
    expect(getAiPlanFromPlanName('Investidor Pro')).toBe('pro');
    expect(getAiPlanFromPlanName('Free')).toBe('free');
  });

  it('identifica PRO+ apenas para assinantes', () => {
    expect(isProOrHigherPlan('Investidor Pro', true)).toBe(true);
    expect(isProOrHigherPlan('Premium', true)).toBe(true);
    expect(isProOrHigherPlan('Premium', false)).toBe(false);
    expect(isProOrHigherPlan('Free', true)).toBe(false);
  });

  it('usa cache local para análise e evita chamada duplicada', async () => {
    analyzeMock.mockResolvedValue({
      ai_analysis: {smart_feed: []},
    });

    const rawAssets = [
      {symbol: 'PETR4', type: 'stock', quantity: 10, price: 30, current_price: 32},
    ];

    const first = await getOrCreateAiAnalysis({
      rawAssets,
      plan: 'pro',
      userId: 'u1',
    });
    const second = await getOrCreateAiAnalysis({
      rawAssets,
      plan: 'pro',
      userId: 'u1',
    });

    expect(first).toEqual(second);
    expect(analyzeMock).toHaveBeenCalledTimes(1);
  });

  it('gera highlights para dashboard com base em carteira e resumo', () => {
    const highlights = deriveDashboardHighlights({
      rawAssets: [
        {
          symbol: 'ITUB4',
          sector: 'Bancos',
          type: 'stock',
          quantity: 100,
          current_price: 30,
        },
        {
          symbol: 'PETR4',
          sector: 'Petróleo',
          type: 'stock',
          quantity: 10,
          current_price: 30,
        },
      ],
      summary: {
        change24h: 487,
        totalDividends: 3744,
      },
      analysis: {
        smart_feed: [
          {
            title: 'Ativo da watchlist em oportunidade',
            content: 'WEGE3 tocou alvo de preço hoje',
            impact: 'positive',
          },
        ],
      } as any,
    });

    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights.some((item) => item.title.includes('carteira ganhou'))).toBe(
      true,
    );
    expect(
      highlights.some((item) => item.title.includes('Dividendos previstos este mês')),
    ).toBe(true);
  });

  it('assinatura de cache é determinística', () => {
    const a = buildAiCacheSignature([
      {symbol: 'VALE3', quantity: 2, price: 10, current_price: 11, type: 'stock'},
      {symbol: 'PETR4', quantity: 1, price: 20, current_price: 21, type: 'stock'},
    ]);
    const b = buildAiCacheSignature([
      {symbol: 'PETR4', quantity: 1, price: 20, current_price: 21, type: 'stock'},
      {symbol: 'VALE3', quantity: 2, price: 10, current_price: 11, type: 'stock'},
    ]);
    expect(a).toBe(b);
  });
});
