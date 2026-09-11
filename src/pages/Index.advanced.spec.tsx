import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import Dashboard from './Index';
import {AdaptiveLevelProvider} from '@/contexts/AdaptiveLevelContext';

/**
 * Slots do handoff alimentados por /returns e /composition (TRA-141).
 *
 * Arquivo separado de `Index.spec.tsx` de propósito: aqui o nível vem de um
 * perfil mockado, e mudar isso no spec principal alteraria o nível de todos
 * os testes dele.
 */

const {getProfileMock, getReturnsMock, getCompositionMock} = vi.hoisted(() => ({
  getProfileMock: vi.fn(),
  getReturnsMock: vi.fn(),
  getCompositionMock: vi.fn(),
}));

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
      data: {year: 2026, accumulatedLosses: {total: 0}, opportunities: []},
    }),
  },
  stockServices: {
    getNationalStock: vi.fn().mockResolvedValue({data: {results: []}}),
    getCdiRate: vi.fn().mockResolvedValue({data: {value: 0, unit: 'daily_percent'}}),
  },
  portfolioService: {
    getReturns: (...args: unknown[]) => getReturnsMock(...args),
    getComposition: (...args: unknown[]) => getCompositionMock(...args),
  },
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({planName: null, isSubscribed: false, isLoading: false}),
}));

vi.mock('@/services/ai/investorProfile', () => ({
  getInvestorProfile: getProfileMock,
  setInvestorProfileOverride: vi.fn(),
}));

const withLevel = (sophistication: 'beginner' | 'intermediate' | 'experienced') =>
  getProfileMock.mockResolvedValue({
    sophistication,
    riskTolerance: 'moderate',
    confidence: 0.9,
    signals: {},
    source: 'inferred',
  });

const returnsPayload = (overrides: Record<string, unknown> = {}) => ({
  data: {
    from: '2025-01-02',
    to: '2025-12-30',
    contribution: {
      currentValue: 50000,
      contributed: 45000,
      marketGain: 5000,
      marketGainPct: 0.111111,
    },
    twr: {value: 0.171, annualized: 0.171, periods: 240},
    irr: 0.18,
    benchmark: {
      symbol: '^BVSP',
      beta: 0.86,
      trackingError: 0.041,
      correlation: 0.8,
      observations: 240,
    },
    unavailable: [],
    staleDays: 0,
    ...overrides,
  },
});

const compositionPayload = {
  data: {
    yield: {
      assets: [],
      portfolioYieldOnCost: 0.0742,
      portfolioYieldOnMarket: 0.068,
      estimatedAnnualIncome: 74220,
      approximated: false,
    },
    rebalancing: {
      buckets: [],
      totalDriftPct: 12.4,
      // Convenção do servidor: alvo − atual. Ações 56,2% vs alvo 50%.
      largestGap: {
        bucket: 'stocks',
        currentPct: 56.2,
        targetPct: 50,
        gapPct: -6.2,
        amount: -48900,
      },
      hasTarget: true,
      totalValue: 788000,
    },
    unavailable: [],
  },
};

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
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

describe('Dashboard — slots do handoff no nível avançado (TRA-141)', () => {
  beforeEach(() => {
    getProfileMock.mockReset();
    getReturnsMock.mockReset();
    getCompositionMock.mockReset();
    withLevel('experienced');
    getReturnsMock.mockResolvedValue(returnsPayload());
    getCompositionMock.mockResolvedValue(compositionPayload);
  });

  // `kpisAdv` do protótipo: 3º KPI é "Yield on cost".
  it('mostra Yield on cost como 3º KPI', async () => {
    renderDashboard();
    expect(await screen.findByText('Yield on cost')).toBeInTheDocument();
    expect(screen.getByText('7,42%')).toBeInTheDocument();
    expect(screen.getByText(/proventos R\$ 74,2k/)).toBeInTheDocument();
  });

  // `kpisAdv`: delta do Patrimônio é o TWR, "TWR desde início".
  it('usa o TWR como delta do Patrimônio', async () => {
    renderDashboard();
    expect(await screen.findByText('TWR desde início')).toBeInTheDocument();
    expect(screen.getByText('+17,1%')).toBeInTheDocument();
  });

  // O protótipo põe beta e tracking error na barra quant, não num painel.
  it('devolve beta e tracking error à barra quantitativa, com valor', async () => {
    renderDashboard();
    expect(await screen.findByText('Beta vs IBOV')).toBeInTheDocument();
    expect(screen.getByText('0,86')).toBeInTheDocument();
    expect(screen.getByText('Tracking error')).toBeInTheDocument();
    expect(screen.getByText('4,1%')).toBeInTheDocument();
  });

  // Linha do card Alocação do handoff, com o sinal na convenção dele.
  it('mostra o maior desvio da política no card Alocação', async () => {
    renderDashboard();
    expect(await screen.findByText('+6,2 p.p. em Ações')).toBeInTheDocument();
    expect(screen.getByText(/rebalanceamento sugerido de R\$\s?48\.900/)).toBeInTheDocument();
  });

  // O motivo de TRA-145: métrica sem valor não ocupa espaço.
  it('omite beta quando o cálculo não foi possível, sem traço', async () => {
    getReturnsMock.mockResolvedValue(
      returnsPayload({
        benchmark: {
          symbol: '^BVSP',
          beta: null,
          trackingError: null,
          correlation: null,
          observations: 8,
        },
      }),
    );
    renderDashboard();
    await screen.findByText('TWR desde início');
    expect(screen.queryByText('Beta vs IBOV')).not.toBeInTheDocument();
    expect(screen.queryByText('Tracking error')).not.toBeInTheDocument();
  });
});

describe('Dashboard — slots do handoff nos níveis base (TRA-141)', () => {
  beforeEach(() => {
    getProfileMock.mockReset();
    getReturnsMock.mockReset();
    getCompositionMock.mockReset();
    getReturnsMock.mockResolvedValue(returnsPayload());
    getCompositionMock.mockResolvedValue(compositionPayload);
  });

  // `kpisBase`: delta do Patrimônio é o rendimento sobre o aportado.
  it('usa o rendimento sobre o aportado como delta no intermediário', async () => {
    withLevel('intermediate');
    renderDashboard();
    expect(await screen.findByText('desde o aporte inicial')).toBeInTheDocument();
    expect(screen.getByText('+11,1%')).toBeInTheDocument();
  });

  it('não mostra YoC, beta nem desvio fora do avançado', async () => {
    withLevel('intermediate');
    renderDashboard();
    await screen.findByText('desde o aporte inicial');
    expect(screen.queryByText('Yield on cost')).not.toBeInTheDocument();
    expect(screen.queryByText('Beta vs IBOV')).not.toBeInTheDocument();
    expect(screen.queryByText('+6,2 p.p. em Ações')).not.toBeInTheDocument();
    // O card de proventos continua no slot.
    expect(screen.getByText('Dividendos recebidos')).toBeInTheDocument();
  });
});
