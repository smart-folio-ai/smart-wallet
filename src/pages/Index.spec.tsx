import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import Dashboard from './Index';
import {AI_GENERATED_NOTICE_TEXT} from '@/components/ui/ai-generated-notice';

vi.mock('@/services/portfolio', () => ({
  default: {
    getPortfolios: vi.fn().mockResolvedValue([]),
    getAssets: vi.fn().mockResolvedValue([]),
    getPortfolio: vi.fn().mockResolvedValue({assets: []}),
    getPortfolioHistory: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/server/api/api', () => ({
  fiscalService: {
    getOptimizer: vi.fn().mockResolvedValue({
      data: {
        year: 2026,
        accumulatedLosses: {total: 0},
        opportunities: [],
        explanation: 'Sem oportunidades no momento.',
      },
    }),
  },
  stockServices: {
    getNationalStock: vi.fn().mockResolvedValue({data: {results: []}}),
    getCdiRate: vi.fn().mockResolvedValue({data: {value: 0, unit: 'daily_percent'}}),
  },
}));

const useSubscriptionMock = vi.fn();

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => useSubscriptionMock(),
}));

beforeEach(() => {
  useSubscriptionMock.mockReturnValue({
    planName: null,
    isSubscribed: false,
    isLoading: false,
  });
});

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Dashboard KPI strip', () => {
  it('renders four KPI tiles above the main charts', async () => {
    renderDashboard();
    expect(await screen.findByText('Patrimônio total')).toBeInTheDocument();
    expect(screen.getByText('P&L do período')).toBeInTheDocument();
    expect(screen.getByText('Dividendos no ano')).toBeInTheDocument();
    // "Yield estimado" also appears in the pre-existing dividend detail card
    // further down the page, so assert at least one instance renders.
    expect(screen.getAllByText('Yield estimado').length).toBeGreaterThan(0);
  });
});

describe('Dashboard neutral card styling', () => {
  it('does not render gradient background classes on insight cards', async () => {
    const {container} = renderDashboard();
    await screen.findByText('Patrimônio total');
    // Use exact class-token matching rather than a CSS substring selector:
    // `[class*="from-amber-50"]` would also match unrelated Tailwind variant
    // classes such as `hover:from-amber-500` (e.g. the pre-existing,
    // out-of-scope PremiumBlur upgrade CTA), producing a false positive.
    const gradientTokens = ['from-emerald-50', 'from-sky-50', 'from-amber-50'];
    const gradientCards = Array.from(
      container.querySelectorAll('[class]'),
    ).filter((el) => {
      const classes = (el.getAttribute('class') || '').split(/\s+/);
      return gradientTokens.some((token) => classes.includes(token));
    });
    expect(gradientCards.length).toBe(0);
  });
});

// TRA-26: o card "Trackerr IA Hoje" é montado por `actionableInsights`, um
// cálculo local sobre a carteira. Nenhum modelo escreve esse texto, então o
// aviso de conteúdo gerado por IA foi removido dali. Este teste impede que ele
// volte — em qualquer plano, já que o conteúdo é o mesmo borrado ou não.
describe('Dashboard sem aviso de IA no card determinístico', () => {
  it.each([
    ['free', {planName: null, isSubscribed: false, isLoading: false}],
    ['pro', {planName: 'pro', isSubscribed: true, isLoading: false}],
  ])('não exibe o aviso de IA no plano %s', async (_plan, subscription) => {
    useSubscriptionMock.mockReturnValue(subscription);

    renderDashboard();
    await screen.findByText('Trackerr IA Hoje');

    expect(screen.queryByText(AI_GENERATED_NOTICE_TEXT)).not.toBeInTheDocument();
  });
});
