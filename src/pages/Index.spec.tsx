import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import Dashboard from './Index';
import {AI_GENERATED_NOTICE_TEXT} from '@/components/ui/ai-generated-notice';
import {AdaptiveLevelProvider} from '@/contexts/AdaptiveLevelContext';

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
  // TRA-141: o dashboard lê retornos e composição para os slots do handoff.
  // Rejeitar aqui exercita o caminho sem dado: os slots mantêm o conteúdo
  // anterior em vez de exibir traço.
  portfolioService: {
    getReturns: vi.fn().mockRejectedValue(new Error('sem retornos no teste')),
    getComposition: vi.fn().mockRejectedValue(new Error('sem composição no teste')),
  },
}));

const useSubscriptionMock = vi.fn();

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => useSubscriptionMock(),
}));

beforeEach(() => {
  localStorage.removeItem('adaptive-level');
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
        <AdaptiveLevelProvider>
          <Dashboard />
        </AdaptiveLevelProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Dashboard KPI strip', () => {
  it('renders three KPI tiles above the main charts', async () => {
    renderDashboard();
    expect(await screen.findByText('Patrimônio total')).toBeInTheDocument();
    // pnlLabel resolves to 'P&L do período' for the default (intermediário) level
    expect(screen.getByText('P&L do período')).toBeInTheDocument();
    // Nocturne redesign — label updated from 'Dividendos no ano'
    expect(screen.getByText('Dividendos recebidos')).toBeInTheDocument();
  });

  // TRA-145 removeu o KPI de topo "Beta da carteira" e as duas entradas da
  // barra quantitativa, todos com '—' fixo.
  //
  // Beta e tracking error voltaram (TRA-141) no lugar que o handoff reserva a
  // eles: a barra quantitativa do nível avançado, e só com valor calculado.
  // Este teste roda no nível padrão e sem dado de retornos, então nenhuma das
  // duas deve aparecer. O KPI de topo "Beta da carteira" não voltou porque o
  // handoff não tem esse card — o 4º KPI do protótipo é VaR 95%.
  //
  // A intenção original segue guardada: nenhuma métrica ocupa espaço
  // permanentemente vazia, porque isso contamina a leitura das vizinhas.
  it('does not render permanently empty metrics in the KPI strip or quant bar', async () => {
    renderDashboard();
    await screen.findByText('Patrimônio total');
    // O card de topo não voltou: β agora vive no painel de rentabilidade.
    expect(screen.queryByText('Beta da carteira')).not.toBeInTheDocument();
    // Nenhuma métrica exibida com traço mudo.
    expect(screen.queryByText('Tracking error')).not.toBeInTheDocument();
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

// TRA-26: a secção "IA Insights" exibe insights derivados localmente (via
// actionableInsights). O aviso de conteúdo gerado por IA (AiGeneratedNotice)
// não é usado no novo layout Nocturne — este teste verifica que o aviso
// não aparece nem no plano free nem no PRO sem carteira.
describe('Dashboard sem aviso de IA quando não há highlights de IA', () => {
  it.each([
    ['free', {planName: null, isSubscribed: false, isLoading: false}],
    ['pro sem carteira', {planName: 'pro', isSubscribed: true, isLoading: false}],
  ])('não exibe o aviso de IA no plano %s', async (_plan, subscription) => {
    useSubscriptionMock.mockReturnValue(subscription);

    renderDashboard();
    // Nocturne redesign — section heading changed from 'Trackerr IA Hoje' to 'IA Insights'
    await screen.findByText('IA Insights');

    expect(screen.queryByText(AI_GENERATED_NOTICE_TEXT)).not.toBeInTheDocument();
  });
});
