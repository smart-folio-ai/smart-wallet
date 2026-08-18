import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import AIInsights from './AIInsights';

const portfolioScoreMock = vi.fn();
const errorRadarMock = vi.fn();
const simulateMock = vi.fn();
const getOrCreateAiAnalysisMock = vi.fn();
const useSubscriptionMock = vi.fn();

vi.mock('@/services/ai', () => ({
  aiAnalysisService: {
    portfolioScore: (...args: unknown[]) => portfolioScoreMock(...args),
    errorRadar: (...args: unknown[]) => errorRadarMock(...args),
    simulate: (...args: unknown[]) => simulateMock(...args),
  },
}));

vi.mock('@/services/ai/trakkerAi', () => ({
  getOrCreateAiAnalysis: (...args: unknown[]) =>
    getOrCreateAiAnalysisMock(...args),
  getAiPlanFromPlanName: () => 'pro',
  isProOrHigherPlan: () => true,
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
});
