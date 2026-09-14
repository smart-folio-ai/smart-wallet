import {describe, it, expect, vi, beforeEach} from 'vitest';
import {act, render, screen, waitFor, fireEvent, within} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import AIInsights from './AIInsights';
import {
  AdaptiveLevelProvider,
  INVESTOR_PROFILE_QUERY_KEY,
} from '@/contexts/AdaptiveLevelContext';

const portfolioScoreMock = vi.fn();
const errorRadarMock = vi.fn();
const futureSimulatorMock = vi.fn();
const getOrCreateAiAnalysisMock = vi.fn();
const useSubscriptionMock = vi.fn();
const isProOrHigherPlanMock = vi.fn();
const getInvestorProfileMock = vi.fn();
const setInvestorProfileOverrideMock = vi.fn();
const getCdiSeriesMock = vi.fn();
const getAssetsMock = vi.fn();
const toastInfoMock = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    info: (...args: unknown[]) => toastInfoMock(...args),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/services/ai', () => ({
  aiAnalysisService: {
    portfolioScore: (...args: unknown[]) => portfolioScoreMock(...args),
    errorRadar: (...args: unknown[]) => errorRadarMock(...args),
    futureSimulator: (...args: unknown[]) => futureSimulatorMock(...args),
  },
}));

vi.mock('@/services/ai/trakkerAi', () => ({
  getOrCreateAiAnalysis: (...args: unknown[]) => getOrCreateAiAnalysisMock(...args),
  getAiPlanFromPlanName: () => 'pro',
  isProOrHigherPlan: (...args: unknown[]) => isProOrHigherPlanMock(...args),
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => useSubscriptionMock(),
}));

vi.mock('@/services/ai/investorProfile', () => ({
  getInvestorProfile: (...args: unknown[]) => getInvestorProfileMock(...args),
  setInvestorProfileOverride: (...args: unknown[]) => setInvestorProfileOverrideMock(...args),
}));

vi.mock('@/server/api/api', () => ({
  stockServices: {
    getCdiSeries: (...args: unknown[]) => getCdiSeriesMock(...args),
  },
  portfolioService: {
    getAssets: (...args: unknown[]) => getAssetsMock(...args),
  },
}));

// O painel de perguntas tem seus próprios testes e faz chamadas próprias.
vi.mock('@/components/ai/RagAskPanel', () => ({
  RagAskPanel: () => <div data-testid="rag-ask-panel" />,
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/ai-insights']}>
        <AdaptiveLevelProvider>
          <Routes>
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/asset/:symbol" element={<div>Página do ativo</div>} />
            <Route path="/subscription" element={<div>Página de planos</div>} />
          </Routes>
        </AdaptiveLevelProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return {...utils, queryClient};
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

const clearRadar = {
  modelVersion: 'portfolio_error_radar_v1',
  status: 'ok',
  riskLevel: 'low',
  alerts: [],
  positionsCount: 4,
};

const baseSimulation = {
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
};

const cdiSeries = {
  data: {series: [{date: '2025-01-01', value: 0.04}, {date: '2025-06-01', value: 0.04}]},
};

const profileWith = (sophistication: string, source = 'inferred') => ({
  sophistication,
  riskTolerance: 'moderate',
  confidence: 0.7,
  signals: {distinctAssetCount: 4, tradesLast12Months: 10, accountAgeDays: 200},
  source,
});

function signalValue(label: string): string | null {
  const row = screen.getByText(label).parentElement as HTMLElement;
  return row.lastElementChild?.textContent ?? null;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  isProOrHigherPlanMock.mockReturnValue(true);
  useSubscriptionMock.mockReturnValue({planName: 'Investidor Pro', isSubscribed: true, isLoading: false});
  getAssetsMock.mockResolvedValue({data: []});
  getOrCreateAiAnalysisMock.mockResolvedValue({ai_analysis: {}});
  portfolioScoreMock.mockResolvedValue(okScore);
  errorRadarMock.mockResolvedValue(clearRadar);
  getInvestorProfileMock.mockResolvedValue(profileWith('intermediate'));
  getCdiSeriesMock.mockResolvedValue(cdiSeries);
});

describe('AIInsights — como a IA definiu seu nível', () => {
  it('mostra score e dimensões determinísticas nas barras de sinais', async () => {
    renderPage();

    await waitFor(() => expect(signalValue('Score da carteira')).toBe('72.5'));
    expect(signalValue('Diversificação')).toBe('65');
    expect(signalValue('Controle de risco')).toBe('80');
    expect(signalValue('Confiança do perfil')).toBe('70%');
    // Consistência e volatilidade vinham do LLM, sem cálculo determinístico.
    expect(screen.queryByText('Consistência')).not.toBeInTheDocument();
    expect(screen.queryByText('Volatilidade')).not.toBeInTheDocument();
  });

  it('usa o nível e a quantidade de sinais do perfil no subtítulo', async () => {
    renderPage();
    expect(await screen.findByText('Sugerido: Intermediário · 3 sinais de uso')).toBeInTheDocument();
  });

  it('mostra "—" e barra vazia quando a carteira não tem dados suficientes', async () => {
    portfolioScoreMock.mockResolvedValue({
      ...okScore,
      overall: null,
      status: 'insufficient_data',
      dimensions: [],
    });
    renderPage();

    await waitFor(() => expect(getOrCreateAiAnalysisMock).toHaveBeenCalled());
    await waitFor(() => expect(signalValue('Score da carteira')).toBe('—'));
    expect(signalValue('Diversificação')).toBe('—');
    expect(screen.getAllByTestId('signal-bar')[0]).toHaveStyle({width: '0%'});
  });

  it('mantém a página utilizável quando só o score falha', async () => {
    portfolioScoreMock.mockRejectedValue(new Error('500'));
    renderPage();

    expect(await screen.findByText(/Nenhum alerta no momento/)).toBeInTheDocument();
    expect(signalValue('Score da carteira')).toBe('—');
    expect(screen.queryByText(/Não foi possível carregar os insights/)).not.toBeInTheDocument();
  });

  it('"Assumir controle manual" grava o nível atual como override no servidor', async () => {
    setInvestorProfileOverrideMock.mockResolvedValue(profileWith('intermediate', 'user_override'));
    renderPage();
    // O botão só habilita depois que o perfil chega do servidor.
    await screen.findByText('Sugerido: Intermediário · 3 sinais de uso');

    fireEvent.click(screen.getByRole('button', {name: 'Assumir controle manual'}));

    await waitFor(() =>
      expect(setInvestorProfileOverrideMock).toHaveBeenCalledWith({sophistication: 'intermediate'}),
    );
    expect(await screen.findByRole('button', {name: 'Devolver controle à IA'})).toBeInTheDocument();
    expect(localStorage.getItem('ai_insights_view_mode')).toBeNull();
  });

  it('"Devolver controle à IA" limpa o override', async () => {
    getInvestorProfileMock.mockResolvedValue(profileWith('experienced', 'user_override'));
    setInvestorProfileOverrideMock.mockResolvedValue(profileWith('intermediate'));
    renderPage();

    expect(await screen.findByText('Manual: Avançado · 3 sinais de uso')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Devolver controle à IA'}));

    await waitFor(() =>
      expect(setInvestorProfileOverrideMock).toHaveBeenCalledWith({sophistication: null}),
    );
  });
});

describe('AIInsights — ficha do modelo', () => {
  it('mostra as versões reais dos modelos e "—" onde a API não informa', async () => {
    renderPage();

    expect(
      await screen.findByText('portfolio_score_v1 · portfolio_error_radar_v1'),
    ).toBeInTheDocument();
    expect(signalValue('Janela de dados')).toBe('—');
    expect(signalValue('Retenção de logs')).toBe('—');
    expect(signalValue('Última execução')).toMatch(/^hoje, \d{2}:\d{2}$/);
    expect(screen.getByText(/O Trackerr não recomenda ativos/)).toBeInTheDocument();
  });
});

describe('AIInsights — feed de insights', () => {
  const radarWithAlerts = {
    ...clearRadar,
    riskLevel: 'high',
    alerts: [
      {code: 'div_low', type: 'diversification', severity: 'medium', message: 'Diversificação baixa'},
      {code: 'ASSET_CONCENTRATION_HIGH', type: 'concentration', severity: 'high', symbol: 'PETR4', message: 'PETR4 representa 42.3% da carteira — concentração alta.'},
    ],
  };

  it('ordena por severidade e mostra prioridade em texto, não só cor', async () => {
    errorRadarMock.mockResolvedValue(radarWithAlerts);
    renderPage();

    const high = await screen.findByText('PETR4 representa 42.3% da carteira — concentração alta.');
    const medium = screen.getByText('Diversificação baixa');
    expect(high.compareDocumentPosition(medium) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByText('Média')).toBeInTheDocument();
  });

  it('monta as abas com "Tudo" e as categorias presentes, com contagem', async () => {
    errorRadarMock.mockResolvedValue(radarWithAlerts);
    renderPage();

    await screen.findByText('Diversificação baixa');
    expect(screen.getByRole('button', {name: 'Tudo 2'})).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', {name: 'Concentração 1'}));

    expect(screen.getByText('PETR4 representa 42.3% da carteira — concentração alta.')).toBeInTheDocument();
    expect(screen.queryByText('Diversificação baixa')).not.toBeInTheDocument();
  });

  it('leva ao ativo pela ação do card', async () => {
    errorRadarMock.mockResolvedValue(radarWithAlerts);
    renderPage();

    await screen.findByText('Diversificação baixa');
    fireEvent.click(screen.getByRole('button', {name: 'Ver ativo'}));

    expect(await screen.findByText('Página do ativo')).toBeInTheDocument();
  });

  it('abre a trilha de auditoria com modelo e origem do insight', async () => {
    errorRadarMock.mockResolvedValue(radarWithAlerts);
    renderPage();

    await screen.findByText('Diversificação baixa');
    fireEvent.click(screen.getAllByRole('button', {name: 'Trilha de auditoria'})[0]);

    expect(toastInfoMock).toHaveBeenCalledWith(
      'Trilha de auditoria',
      expect.objectContaining({
        description: expect.stringContaining('portfolio_error_radar_v1 · cálculo determinístico'),
      }),
    );
  });

  it('não inventa confiança nem nº de fontes que a API não devolve', async () => {
    errorRadarMock.mockResolvedValue(radarWithAlerts);
    renderPage();

    await screen.findByText('Diversificação baixa');
    expect(screen.getAllByText('confiança —')).toHaveLength(2);
    expect(screen.getAllByText('fontes —')).toHaveLength(2);
  });

  it('mostra o detalhe técnico a partir do intermediário e esconde no iniciante', async () => {
    errorRadarMock.mockResolvedValue(radarWithAlerts);
    const {queryClient} = renderPage();

    expect(await screen.findByText(/Regra ASSET_CONCENTRATION_HIGH/)).toBeInTheDocument();

    act(() => {
      queryClient.setQueryData(INVESTOR_PROFILE_QUERY_KEY, profileWith('beginner'));
    });

    await waitFor(() =>
      expect(screen.queryByText(/Regra ASSET_CONCENTRATION_HIGH/)).not.toBeInTheDocument(),
    );
  });

  it('mostra estado neutro quando o radar não tem alertas', async () => {
    renderPage();
    expect(await screen.findByText(/Nenhum alerta no momento/)).toBeInTheDocument();
  });

  it('mostra falha explícita do radar sem derrubar a página', async () => {
    errorRadarMock.mockRejectedValue(new Error('network error'));
    renderPage();

    expect(await screen.findByText('Não foi possível carregar o radar.')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Tentar novamente'})).toBeInTheDocument();
    expect(signalValue('Score da carteira')).toBe('72.5');
    expect(screen.queryByText(/Nenhum alerta no momento/)).not.toBeInTheDocument();
  });

  it('mostra erro com nova tentativa quando a análise falha', async () => {
    getOrCreateAiAnalysisMock.mockRejectedValueOnce(new Error('500'));
    renderPage();

    expect(await screen.findByText(/Não foi possível carregar os insights agora/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Tentar novamente'}));

    expect(await screen.findByText(/Nenhum alerta no momento/)).toBeInTheDocument();
  });

  it('marca oportunidades do LLM com o aviso de conteúdo gerado por IA', async () => {
    getOrCreateAiAnalysisMock.mockResolvedValue({
      ai_analysis: {
        opportunity_radar: [{symbol: 'BBAS3', type: 'attractive_range', price: 20, rationale: 'P/L baixo'}],
      },
    });
    renderPage();

    const title = await screen.findByText('BBAS3');
    const card = title.closest('section') as HTMLElement;
    // Sem prioridade na resposta do LLM: o badge não inventa uma.
    expect(within(card).queryByText(/^(Alta|Média|Baixa)$/)).not.toBeInTheDocument();
    expect(
      screen.getByText('Esse texto foi gerado com o auxílio de inteligência artificial.'),
    ).toBeInTheDocument();
  });

  it('atualiza a análise pelo botão do cabeçalho do feed', async () => {
    renderPage();

    const refresh = await screen.findByLabelText('Atualizar análise');
    await waitFor(() => expect(refresh).not.toBeDisabled());
    fireEvent.click(refresh);

    await waitFor(() => expect(getOrCreateAiAnalysisMock).toHaveBeenCalledTimes(2));
  });
});

describe('AIInsights — usuário sem plano Pro', () => {
  beforeEach(() => {
    useSubscriptionMock.mockReturnValue({planName: 'Free', isSubscribed: false, isLoading: false});
    isProOrHigherPlanMock.mockReturnValue(false);
  });

  it('não busca a análise e oferece os planos', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', {name: 'Ver planos'}));

    expect(await screen.findByText('Página de planos')).toBeInTheDocument();
    expect(getOrCreateAiAnalysisMock).not.toHaveBeenCalled();
    expect(errorRadarMock).not.toHaveBeenCalled();
  });

  it('não mostra falha do radar — a busca nunca aconteceu', async () => {
    renderPage();
    await screen.findByRole('button', {name: 'Ver planos'});
    expect(screen.queryByText('Não foi possível carregar o radar.')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Atualizar análise')).not.toBeInTheDocument();
  });
});

describe('AIInsights — simulador de futuro', () => {
  async function renderAndWait() {
    const utils = renderPage();
    await screen.findByText(/Nenhum alerta no momento/);
    return utils;
  }

  it('chama o simulador com horizonte e aporte e exibe o cenário base', async () => {
    futureSimulatorMock.mockResolvedValue({
      ...baseSimulation,
      scenarios: {
        ...baseSimulation.scenarios,
        base: {...baseSimulation.scenarios.base, projectedValue: 200000},
      },
    });
    await renderAndWait();

    fireEvent.click(screen.getByRole('button', {name: '5 anos'}));
    fireEvent.click(screen.getByRole('button', {name: 'Calcular Projeção IA'}));

    await waitFor(() =>
      expect(futureSimulatorMock).toHaveBeenCalledWith({horizon: '5y', monthlyContribution: 1000}),
    );
    expect(await screen.findByText('R$ 200.000,00')).toBeInTheDocument();
  });

  it('volta ao estado inicial quando a simulação falha', async () => {
    futureSimulatorMock.mockRejectedValue(new Error('500'));
    await renderAndWait();

    fireEvent.click(screen.getByRole('button', {name: 'Calcular Projeção IA'}));

    await waitFor(() => expect(futureSimulatorMock).toHaveBeenCalled());
    expect(screen.getByText(/Ajuste os aportes e simule/)).toBeInTheDocument();
  });

  it('limpa a projeção ao trocar o horizonte', async () => {
    futureSimulatorMock.mockResolvedValue(baseSimulation);
    await renderAndWait();

    fireEvent.click(screen.getByRole('button', {name: 'Calcular Projeção IA'}));
    expect(await screen.findByText('R$ 847.000,00')).toBeInTheDocument();
    expect(screen.getByText('CDI acumulado (últimos 120 meses)')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: '1 ano'}));

    expect(screen.queryByText('R$ 847.000,00')).not.toBeInTheDocument();
    expect(screen.queryByText('CDI acumulado (últimos 120 meses)')).not.toBeInTheDocument();
  });

  it('não compara com CDI no nível iniciante', async () => {
    getInvestorProfileMock.mockResolvedValue(profileWith('beginner'));
    futureSimulatorMock.mockResolvedValue(baseSimulation);
    await renderAndWait();
    // Até o perfil chegar o nível é o default intermediário, que mostraria o CDI.
    await screen.findByText('Sugerido: Iniciante · 3 sinais de uso');

    fireEvent.click(screen.getByRole('button', {name: 'Calcular Projeção IA'}));

    expect(await screen.findByText('R$ 847.000,00')).toBeInTheDocument();
    expect(screen.queryByText('CDI acumulado (últimos 120 meses)')).not.toBeInTheDocument();
    expect(getCdiSeriesMock).not.toHaveBeenCalled();
  });

  it('esconde a projeção calculada ao trocar o nível de detalhe', async () => {
    getInvestorProfileMock.mockResolvedValue(profileWith('experienced'));
    futureSimulatorMock.mockResolvedValue(baseSimulation);
    const {queryClient} = await renderAndWait();
    await screen.findByText('Sugerido: Avançado · 3 sinais de uso');

    fireEvent.click(screen.getByRole('button', {name: 'Calcular Projeção IA'}));
    expect(await screen.findByText('R$ 847.000,00')).toBeInTheDocument();

    act(() => {
      queryClient.setQueryData(INVESTOR_PROFILE_QUERY_KEY, profileWith('beginner'));
    });

    await waitFor(() => expect(screen.queryByText('R$ 847.000,00')).not.toBeInTheDocument());
    expect(screen.getByText('Ajuste os aportes e simule o poder dos juros compostos.')).toBeInTheDocument();
  });
});
