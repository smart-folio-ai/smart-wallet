import {describe, expect, it, vi, beforeEach} from 'vitest';
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';

import AIInsights from './AIInsights';

const getAssetsMock = vi.fn();
const getSummaryMock = vi.fn();
const getOptimizerMock = vi.fn();
const getOrCreateAiAnalysisMock = vi.fn();

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    planName: 'premium',
    isSubscribed: true,
    isLoading: false,
  }),
}));

vi.mock('@/server/api/api', () => ({
  portfolioService: {
    getAssets: (...args: unknown[]) => getAssetsMock(...args),
  },
  fiscalService: {
    getSummary: (...args: unknown[]) => getSummaryMock(...args),
    getOptimizer: (...args: unknown[]) => getOptimizerMock(...args),
  },
}));

vi.mock('@/services/ai/trakkerAi', () => ({
  getAiPlanFromPlanName: () => 'premium',
  isProOrHigherPlan: () => true,
  getOrCreateAiAnalysis: (...args: unknown[]) => getOrCreateAiAnalysisMock(...args),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('AIInsights V2 page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    getAssetsMock.mockResolvedValue({
      data: [
        {symbol: 'VALE3', type: 'stock', quantity: 100, current_price: 60},
        {symbol: 'MXRF11', type: 'fii', quantity: 100, current_price: 10},
      ],
    });
    getSummaryMock.mockRejectedValue(new Error('no fiscal summary'));
    getOptimizerMock.mockRejectedValue(new Error('no fiscal optimizer'));
    getOrCreateAiAnalysisMock.mockResolvedValue({
      investment_score: {
        overall: 61,
        diversification: 44,
        risk: 52,
        consistency: 70,
        volatility: 48,
      },
      portfolio_assessment: '',
      opportunity_radar: [],
      error_detection: [],
      rebalancing: {
        ideal_allocation: [
          {category: 'Ações', current: 75, ideal: 55},
          {category: 'FIIs', current: 25, ideal: 45},
        ],
        top_moves: ['Aumentar FIIs'],
      },
    });
  });

  it('renders priority card, deterministic fallback and explicit unavailable states', async () => {
    render(
      <MemoryRouter>
        <AIInsights />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('insights-v2-page')).toBeDefined();
      expect(screen.getByTestId('insights-scan-layer')).toBeDefined();
      expect(screen.getByTestId('insights-charts-layer')).toBeDefined();
      expect(screen.getByTestId('insights-decision-layer')).toBeDefined();
      expect(screen.getByTestId('insights-strategy-layer')).toBeDefined();
      expect(screen.getByTestId('insights-priority-card')).toBeDefined();
      expect(screen.getByTestId('insights-opinion-card')).toBeDefined();
      expect(screen.getByTestId('insights-ai-summary').textContent).toContain(
        'Síntese IA indisponível',
      );
      expect(screen.getByTestId('unavailable-portfolio_evolution')).toBeDefined();
      expect(screen.getByTestId('insights-warning-block')).toBeDefined();
    });
  });

  it('opens expanded drawer from scan card and closes with ESC', async () => {
    render(
      <MemoryRouter>
        <AIInsights />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('insights-v2-page')).toBeDefined();
    });

    const scanCard = screen.getByTestId('scan-card-scan_top_opportunity');
    fireEvent.click(within(scanCard).getByRole('button', {name: 'Entender melhor'}));

    await waitFor(() => {
      expect(screen.getByTestId('insight-expanded-sheet')).toBeDefined();
    });

    fireEvent.keyDown(document, {key: 'Escape'});
    await waitFor(() => {
      expect(screen.queryByTestId('insight-expanded-sheet')).toBeNull();
    });
  });

  it('opens expanded context from strategic card and renders degraded explicit state', async () => {
    render(
      <MemoryRouter>
        <AIInsights />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('expand-opportunity_radar')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('expand-opportunity_radar'));

    await waitFor(() => {
      expect(screen.getByTestId('insight-expanded-sheet')).toBeDefined();
      expect(screen.getByText(/Estado degradado:/)).toBeDefined();
    });
  });
});
