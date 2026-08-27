import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import AIInsights from './AIInsights';

const portfolioScoreMock = vi.fn();
const errorRadarMock = vi.fn();
const futureSimulatorMock = vi.fn();
const getOrCreateAiAnalysisMock = vi.fn();
const useSubscriptionMock = vi.fn();
const isProOrHigherPlanMock = vi.fn();

vi.mock('@/services/ai', () => ({
  aiAnalysisService: {
    portfolioScore: (...args: unknown[]) => portfolioScoreMock(...args),
    errorRadar: (...args: unknown[]) => errorRadarMock(...args),
    futureSimulator: (...args: unknown[]) => futureSimulatorMock(...args),
  },
}));

vi.mock('@/services/ai/trakkerAi', () => ({
  getOrCreateAiAnalysis: (...args: unknown[]) =>
    getOrCreateAiAnalysisMock(...args),
  getAiPlanFromPlanName: () => 'pro',
  isProOrHigherPlan: (...args: unknown[]) => isProOrHigherPlanMock(...args),
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => useSubscriptionMock(),
}));

vi.mock('@/server/api/api', () => ({
  portfolioService: {
    getAssets: vi.fn().mockResolvedValue({data: []}),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <AIInsights />
    </MemoryRouter>,
  );
}

const okScore = {
  modelVersion: 'portfolio_score_v1',
  overall: 72.5,
  status: 'ok',
  dimensions: [
    {key: 'diversification', score: 65, weight: 0.5},
    {key: 'risk', score: 80, weight: 0.5},
  ],
  diversificationStatus: 'good',
  riskLevel: 'low',
  flags: [],
  positionsCount: 4,
};

describe('AIInsights — score da carteira', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isProOrHigherPlanMock.mockReturnValue(true);
    useSubscriptionMock.mockReturnValue({
      planName: 'Investidor Pro',
      isSubscribed: true,
      isLoading: false,
    });
    getOrCreateAiAnalysisMock.mockResolvedValue({ai_analysis: {}});
    portfolioScoreMock.mockResolvedValue(okScore);
    errorRadarMock.mockResolvedValue({
      modelVersion: 'portfolio_error_radar_v1',
      status: 'ok',
      riskLevel: 'low',
      alerts: [],
      positionsCount: 4,
    });
  });

  it('exibe o overall vindo do endpoint determinístico', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('72.5')).toBeInTheDocument();
    });
    expect(screen.getByText('Score da carteira')).toBeInTheDocument();
  });

  it('renderiza apenas diversificação e controle de risco', async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Diversificação')).toBeInTheDocument(),
    );

    expect(screen.getByText('Controle de risco')).toBeInTheDocument();
    // Consistência e volatilidade vinham do LLM e não têm cálculo
    // determinístico — foram removidas, não substituídas por zero.
    expect(screen.queryByText('Consistência')).not.toBeInTheDocument();
    expect(screen.queryByText('Volatilidade')).not.toBeInTheDocument();
  });

  it('rotula a dimensão de risco como "controle", já que vem invertida', async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Controle de risco')).toBeInTheDocument(),
    );
    // Uma barra cheia sob o rótulo "Risco" leria como o oposto do que é.
    expect(screen.queryByText('Risco')).not.toBeInTheDocument();
  });

  describe('carteira sem dados suficientes', () => {
    beforeEach(() => {
      portfolioScoreMock.mockResolvedValue({
        ...okScore,
        overall: null,
        status: 'insufficient_data',
        dimensions: [],
        diversificationStatus: null,
        riskLevel: null,
        positionsCount: 0,
      });
    });

    it('mostra em dash e não zero', async () => {
      renderPage();

      await waitFor(() =>
        expect(screen.getByText('Sem dados suficientes')).toBeInTheDocument(),
      );
      expect(screen.getByText('--')).toBeInTheDocument();
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('não renderiza as barras de dimensão', async () => {
      renderPage();

      await waitFor(() =>
        expect(screen.getByText('Sem dados suficientes')).toBeInTheDocument(),
      );
      expect(screen.queryByText('Diversificação')).not.toBeInTheDocument();
    });
  });

  it('mantém a página utilizável quando só o score falha', async () => {
    portfolioScoreMock.mockRejectedValue(new Error('500'));

    renderPage();

    // A análise do LLM resolveu, então a página não vai para o estado de erro
    // — o score simplesmente não aparece. As duas chamadas são independentes.
    await waitFor(() => {
      expect(screen.getByText('--')).toBeInTheDocument();
    });
    expect(
      screen.queryByText('Ops! Algo deu errado.'),
    ).not.toBeInTheDocument();
  });

  describe('Radar Anti-Erro', () => {
    it('exibe o rótulo em português e o symbol do alerta', async () => {
      errorRadarMock.mockResolvedValue({
        modelVersion: 'portfolio_error_radar_v1',
        status: 'ok',
        riskLevel: 'high',
        alerts: [
          {
            code: 'ASSET_CONCENTRATION_HIGH',
            type: 'concentration',
            severity: 'high',
            message: 'PETR4 representa 42.3% da carteira — concentração alta.',
            symbol: 'PETR4',
          },
        ],
        positionsCount: 3,
      });

      renderPage();

      await waitFor(() => {
        expect(
          screen.getByText('PETR4 representa 42.3% da carteira — concentração alta.'),
        ).toBeInTheDocument();
      });
      expect(screen.getByText('Concentração')).toBeInTheDocument();
      expect(screen.getByText('PETR4')).toBeInTheDocument();
    });

    it('mostra estado neutro quando não há alertas', async () => {
      renderPage();

      await waitFor(() => {
        expect(
          screen.getByText(/Nenhum alerta no momento/),
        ).toBeInTheDocument();
      });
    });

    it('mantém a página utilizável quando só o radar falha', async () => {
      errorRadarMock.mockRejectedValue(new Error('500'));

      renderPage();

      await waitFor(() => {
        expect(screen.getByText('72.5')).toBeInTheDocument();
      });
      expect(
        screen.queryByText('Ops! Algo deu errado.'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Nenhum alerta no momento/),
      ).not.toBeInTheDocument();
    });
  });

  describe('Simulador de Futuro', () => {
    const okSimulation = {
      modelVersion: 'future_simulator_v1',
      horizon: '10y',
      months: 120,
      currentPortfolioValue: 5000,
      monthlyContribution: 1000,
      scenarios: {
        pessimistic: {
          label: 'pessimistic',
          annualReturnPct: 0.02,
          projectedValue: 140000,
          range: {lower: 130000, upper: 150000},
          projectedDividendFlow: {monthly: 50, annual: 600},
        },
        base: {
          label: 'base',
          annualReturnPct: 0.08,
          projectedValue: 200000,
          range: {lower: 180000, upper: 220000},
          projectedDividendFlow: {monthly: 80, annual: 960},
        },
        optimistic: {
          label: 'optimistic',
          annualReturnPct: 0.14,
          projectedValue: 260000,
          range: {lower: 240000, upper: 280000},
          projectedDividendFlow: {monthly: 110, annual: 1320},
        },
      },
      assumptions: {
        contributionFrequency: 'monthly',
        scenarioReturnsAnnualPct: {pessimistic: 0.02, base: 0.08, optimistic: 0.14},
      },
      dividendProjection: {current: {monthly: 40, annual: 480}},
      limitations: [],
      confidence: 'high',
    };

    it('chama futureSimulator com o horizonte selecionado e o aporte mensal, exibindo o cenário base', async () => {
      futureSimulatorMock.mockResolvedValue(okSimulation);

      renderPage();
      await waitFor(() => expect(screen.getByText('72.5')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', {name: '5 anos'}));
      fireEvent.click(
        screen.getByRole('button', {name: /Calcular Projeção IA/}),
      );

      await waitFor(() => {
        expect(futureSimulatorMock).toHaveBeenCalledWith({
          horizon: '5y',
          monthlyContribution: 1000,
        });
      });
      expect(screen.getByText('R$ 200.000,00')).toBeInTheDocument();
    });

    it('mostra erro quando a simulação falha, sem quebrar a página', async () => {
      futureSimulatorMock.mockRejectedValue(new Error('500'));

      renderPage();
      await waitFor(() => expect(screen.getByText('72.5')).toBeInTheDocument());

      fireEvent.click(
        screen.getByRole('button', {name: /Calcular Projeção IA/}),
      );

      await waitFor(() => {
        expect(futureSimulatorMock).toHaveBeenCalled();
      });
      expect(
        screen.getByText(/Ajuste os aportes e simule/),
      ).toBeInTheDocument();
    });
  });

  describe('AIInsights — simulador nao mantem resultado obsoleto', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      useSubscriptionMock.mockReturnValue({
        planName: 'Investidor Pro',
        isSubscribed: true,
        isLoading: false,
      });
      getOrCreateAiAnalysisMock.mockResolvedValue({ai_analysis: {}});
      portfolioScoreMock.mockResolvedValue(okScore);
      errorRadarMock.mockResolvedValue({
        modelVersion: 'portfolio_error_radar_v1',
        status: 'ok',
        riskLevel: 'low',
        alerts: [],
        positionsCount: 0,
      });
    });

    it('limpa a projecao ao trocar o horizonte apos calcular', async () => {
      futureSimulatorMock.mockResolvedValue({
        modelVersion: 'future_simulator_v1',
        horizon: '10y',
        months: 120,
        currentPortfolioValue: 1000,
        monthlyContribution: 1000,
        scenarios: {
          pessimistic: {label: 'pessimistic', annualReturnPct: 2, projectedValue: 100000, range: {lower: 90000, upper: 110000}, projectedDividendFlow: {monthly: 0, annual: 0}},
          base: {label: 'base', annualReturnPct: 8, projectedValue: 847000, range: {lower: 800000, upper: 900000}, projectedDividendFlow: {monthly: 0, annual: 0}},
          optimistic: {label: 'optimistic', annualReturnPct: 14, projectedValue: 1200000, range: {lower: 1100000, upper: 1300000}, projectedDividendFlow: {monthly: 0, annual: 0}},
        },
        assumptions: {contributionFrequency: 'monthly', scenarioReturnsAnnualPct: {pessimistic: 2, base: 8, optimistic: 14}},
        dividendProjection: {current: {monthly: 0, annual: 0}},
        limitations: [],
        confidence: 'high',
      });

      renderPage();
      const calcButton = await screen.findByText('Calcular Projeção IA');
      fireEvent.click(calcButton);

      await waitFor(() => {
        expect(screen.getByText(/847.000|847\.000,00/)).toBeInTheDocument();
      });

      const oneYearButton = screen.getByText('1 ano');
      fireEvent.click(oneYearButton);

      expect(screen.queryByText(/847.000|847\.000,00/)).not.toBeInTheDocument();
      expect(
        screen.getByText('Ajuste os aportes e simule o poder dos juros compostos.'),
      ).toBeInTheDocument();
    });
  });
});

describe('AIInsights — badge Pro Account', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isProOrHigherPlanMock.mockReturnValue(true);
    getOrCreateAiAnalysisMock.mockResolvedValue({ai_analysis: {}});
    portfolioScoreMock.mockResolvedValue(okScore);
    errorRadarMock.mockResolvedValue({
      modelVersion: 'portfolio_error_radar_v1',
      status: 'ok',
      riskLevel: 'low',
      alerts: [],
      positionsCount: 0,
    });
  });

  it('mostra o badge Pro Account para assinante premium', async () => {
    useSubscriptionMock.mockReturnValue({
      planName: 'Investidor Pro',
      isSubscribed: true,
      isLoading: false,
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Insights IA')).toBeInTheDocument();
    });
    expect(screen.getByText('Pro Account')).toBeInTheDocument();
  });

  it('nao mostra o badge Pro Account para usuario free', async () => {
    useSubscriptionMock.mockReturnValue({
      planName: 'Free',
      isSubscribed: false,
      isLoading: false,
    });
    isProOrHigherPlanMock.mockReturnValue(false);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Insights IA')).toBeInTheDocument();
    });
    expect(screen.queryByText('Pro Account')).not.toBeInTheDocument();
  });
});
