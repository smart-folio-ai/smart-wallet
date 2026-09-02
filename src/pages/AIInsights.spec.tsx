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

const getInvestorProfileMock = vi.fn();
const setInvestorProfileOverrideMock = vi.fn();

vi.mock('@/services/ai/investorProfile', () => ({
  getInvestorProfile: (...args: unknown[]) => getInvestorProfileMock(...args),
  setInvestorProfileOverride: (...args: unknown[]) =>
    setInvestorProfileOverrideMock(...args),
}));

const getCdiSeriesMock = vi.fn();

vi.mock('@/server/api/api', () => ({
  stockServices: {
    getCdiSeries: (...args: unknown[]) => getCdiSeriesMock(...args),
  },
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

const defaultInvestorProfile = {
  sophistication: 'intermediate' as const,
  riskTolerance: 'moderate' as const,
  confidence: 0.7,
  signals: {},
  source: 'inferred' as const,
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
    getInvestorProfileMock.mockResolvedValue(defaultInvestorProfile);
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
      getInvestorProfileMock.mockResolvedValue(defaultInvestorProfile);
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

describe('AIInsights — severidade do radar de erro', () => {
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
    getInvestorProfileMock.mockResolvedValue(defaultInvestorProfile);
  });

  it('ordena alertas por severidade e mostra chip de texto, nao so cor', async () => {
    errorRadarMock.mockResolvedValue({
      modelVersion: 'portfolio_error_radar_v1',
      status: 'ok',
      riskLevel: 'high',
      positionsCount: 3,
      alerts: [
        {code: 'div_low', type: 'diversification', severity: 'medium', message: 'Diversificação baixa'},
        {code: 'conc_high', type: 'concentration', severity: 'high', symbol: 'PETR4', message: 'Concentração alta em PETR4'},
      ],
    });
    renderPage();

    const highChip = await screen.findByText('ALTO');
    const mediumChip = screen.getByText('MÉDIO');
    expect(highChip).toBeInTheDocument();
    expect(mediumChip).toBeInTheDocument();

    // resumo no topo
    expect(screen.getByText(/2 alertas/)).toBeInTheDocument();
    expect(screen.getByText(/1 alto/)).toBeInTheDocument();
  });

  it('mostra mensagem de falha explicita quando o radar nao carrega', async () => {
    errorRadarMock.mockRejectedValue(new Error('network error'));
    renderPage();

    expect(
      await screen.findByText('Não foi possível carregar o radar.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
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
    getInvestorProfileMock.mockResolvedValue(defaultInvestorProfile);
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

  it('nao mostra falha do radar para usuario free — fetchData nunca tentou buscar', async () => {
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
    expect(
      screen.queryByText('Não foi possível carregar o radar.'),
    ).not.toBeInTheDocument();
  });
});

describe('AIInsights — transparencia de conteudo gerado por IA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isProOrHigherPlanMock.mockReturnValue(true);
    useSubscriptionMock.mockReturnValue({
      planName: 'Investidor Pro',
      isSubscribed: true,
      isLoading: false,
    });
    portfolioScoreMock.mockResolvedValue(okScore);
    errorRadarMock.mockResolvedValue({
      modelVersion: 'portfolio_error_radar_v1',
      status: 'ok',
      riskLevel: 'low',
      alerts: [],
      positionsCount: 0,
    });
    getInvestorProfileMock.mockResolvedValue(defaultInvestorProfile);
  });

  it('mostra aviso de conteudo gerado por IA junto do radar de oportunidades', async () => {
    getOrCreateAiAnalysisMock.mockResolvedValue({
      ai_analysis: {
        opportunity_radar: [
          {symbol: 'BBAS3', type: 'attractive_range', price: 20, rationale: 'P/L baixo'},
        ],
      },
    });
    renderPage();

    const notices = await screen.findAllByText(
      'Esse texto foi gerado com o auxílio de inteligência artificial.',
    );
    expect(notices.length).toBeGreaterThan(0);
  });

  it('mostra botao de atualizar no header apos carregar com sucesso', async () => {
    getOrCreateAiAnalysisMock.mockResolvedValue({ai_analysis: {}});
    renderPage();

    expect(await screen.findByLabelText('Atualizar análise')).toBeInTheDocument();
  });
});

describe('AIInsights — comparacao com CDI no modo avancado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    isProOrHigherPlanMock.mockReturnValue(true);
    localStorage.setItem('ai_insights_view_mode', 'advanced');
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
    getInvestorProfileMock.mockResolvedValue(defaultInvestorProfile);
  });

  it('mostra a comparacao com CDI apos simular, no modo avancado', async () => {
    getCdiSeriesMock.mockResolvedValue({
      data: {series: [{date: '2025-01-01', value: 0.04}, {date: '2025-06-01', value: 0.04}]},
    });
    futureSimulatorMock.mockResolvedValue({
      modelVersion: 'future_simulator_v1',
      horizon: '10y',
      months: 120,
      currentPortfolioValue: 100000,
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

    // "before" assertion: a comparacao com CDI nao deve existir antes de simular.
    expect(screen.queryByText('CDI acumulado (últimos 120 meses)')).not.toBeInTheDocument();

    fireEvent.click(calcButton);

    expect(await screen.findByText('CDI acumulado (últimos 120 meses)')).toBeInTheDocument();
  });

  it('nao mostra a comparacao com CDI no modo padrao', async () => {
    localStorage.setItem('ai_insights_view_mode', 'standard');
    futureSimulatorMock.mockResolvedValue({
      modelVersion: 'future_simulator_v1',
      horizon: '10y',
      months: 120,
      currentPortfolioValue: 100000,
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
    expect(screen.queryByText('CDI acumulado (últimos 120 meses)')).not.toBeInTheDocument();
  });

  it('limpa a comparacao com CDI ao trocar o horizonte apos calcular', async () => {
    getCdiSeriesMock.mockResolvedValue({
      data: {series: [{date: '2025-01-01', value: 0.04}, {date: '2025-06-01', value: 0.04}]},
    });
    futureSimulatorMock.mockResolvedValue({
      modelVersion: 'future_simulator_v1',
      horizon: '10y',
      months: 120,
      currentPortfolioValue: 100000,
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

    expect(await screen.findByText('CDI acumulado (últimos 120 meses)')).toBeInTheDocument();

    const oneYearButton = screen.getByText('1 ano');
    fireEvent.click(oneYearButton);

    expect(screen.queryByText('CDI acumulado (últimos 120 meses)')).not.toBeInTheDocument();
  });
});

describe('AIInsights — toggle Padrao/Avancado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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
      positionsCount: 0,
    });
    getInvestorProfileMock.mockResolvedValue({
      sophistication: 'experienced',
      riskTolerance: 'aggressive',
      confidence: 0.9,
      signals: {},
      source: 'inferred',
    });
  });

  it('abre em modo avancado quando o perfil e experienced e nao ha preferencia salva', async () => {
    renderPage();

    // "before" assertion: enquanto o perfil ainda nao carregou, o toggle
    // comeca no modo padrao (estado inicial do useState).
    const toggle = await screen.findByLabelText('Modo avançado');
    await waitFor(() => {
      expect(toggle).toBeChecked();
    });
  });

  it('persiste a escolha do usuario em localStorage entre remounts', async () => {
    const {unmount} = renderPage();
    const toggle = await screen.findByLabelText('Modo avançado');
    await waitFor(() => {
      expect(toggle).toBeChecked();
    });

    fireEvent.click(toggle);
    expect(localStorage.getItem('ai_insights_view_mode')).toBe('standard');
    unmount();

    renderPage();
    const toggleAfterRemount = await screen.findByLabelText('Modo avançado');
    await waitFor(() => {
      expect(toggleAfterRemount).not.toBeChecked();
    });
  });

  it('mostra o badge de perfil quando o perfil carrega', async () => {
    renderPage();
    expect(await screen.findByText('Perfil: Experiente')).toBeInTheDocument();
  });

  it('limpa a simulacao ja calculada ao trocar o modo Padrao/Avancado', async () => {
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

    const toggle = screen.getByLabelText('Modo avançado');
    fireEvent.click(toggle);

    expect(screen.queryByText(/847.000|847\.000,00/)).not.toBeInTheDocument();
    expect(
      screen.getByText('Ajuste os aportes e simule o poder dos juros compostos.'),
    ).toBeInTheDocument();
  });

  it('fluxo completo: perfil -> badge -> override -> toggle -> CDI', async () => {
    getInvestorProfileMock.mockResolvedValue({
      sophistication: 'intermediate',
      riskTolerance: 'moderate',
      confidence: 0.7,
      signals: {},
      source: 'inferred',
    });

    renderPage();

    // 1-2. badge mostra o perfil carregado
    expect(
      await screen.findByText('Perfil: Intermediário'),
    ).toBeInTheDocument();

    // 3. abre o popover e escolhe "Experiente"
    fireEvent.click(screen.getByText('Perfil: Intermediário'));
    const experiencedOption = await screen.findByText('Experiente');

    // 4. o override retorna o perfil atualizado
    setInvestorProfileOverrideMock.mockResolvedValue({
      sophistication: 'experienced',
      riskTolerance: 'moderate',
      confidence: 0.7,
      signals: {},
      source: 'user_override',
    });
    fireEvent.click(experiencedOption);

    await waitFor(() => {
      expect(setInvestorProfileOverrideMock).toHaveBeenCalledWith({
        sophistication: 'experienced',
      });
    });

    // 5. o badge reflete a resposta do override, nao so o clique
    expect(
      await screen.findByText('Perfil: Experiente'),
    ).toBeInTheDocument();

    // 6. liga o modo Avancado
    const toggle = screen.getByLabelText('Modo avançado');
    if (!(toggle as HTMLInputElement).checked) {
      fireEvent.click(toggle);
    }
    await waitFor(() => {
      expect(toggle).toBeChecked();
    });

    // 7. roda o simulador
    getCdiSeriesMock.mockResolvedValue({
      data: {series: [{date: '2025-01-01', value: 0.04}, {date: '2025-06-01', value: 0.04}]},
    });
    futureSimulatorMock.mockResolvedValue({
      modelVersion: 'future_simulator_v1',
      horizon: '10y',
      months: 120,
      currentPortfolioValue: 100000,
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

    fireEvent.click(screen.getByText('Calcular Projeção IA'));

    // 8. a comparacao com CDI aparece
    expect(
      await screen.findByText('CDI acumulado (últimos 120 meses)'),
    ).toBeInTheDocument();
  });
});
