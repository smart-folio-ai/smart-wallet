import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import AssetDetail from './AssetDetail';
import {AI_GENERATED_NOTICE_TEXT} from '@/components/ui/ai-generated-notice';

const getNationalStockMock = vi.fn();
const useSubscriptionMock = vi.fn();

vi.mock('@/services/stocks', () => ({
  default: {
    getNationalStock: (...args: unknown[]) => getNationalStockMock(...args),
  },
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => useSubscriptionMock(),
}));

const renderAssetDetail = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false},
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/asset/BBDC4']}>
        <Routes>
          <Route path="/asset/:symbol" element={<AssetDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('AssetDetail — card de Opinião IA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSubscriptionMock.mockReturnValue({
      hasAiInsights: false,
    });
    getNationalStockMock.mockResolvedValue({
      results: [
        {
          symbol: 'BBDC4',
          longName: 'Banco Bradesco S.A.',
          shortName: 'BBDC4',
          regularMarketPrice: 20,
          regularMarketChangePercent: 1.5,
          regularMarketChange: 0.3,
          epsTrailingTwelveMonths: 2,
          bookValuePerShare: 15,
          priceToBook: 1.3,
          historicalDataPrice: [],
          dividendsData: {cashDividends: []},
        },
      ],
    });
  });

  it('não usa mais gradiente nem anel de destaque', async () => {
    renderAssetDetail();

    await waitFor(() => {
      expect(screen.getByText('Opinião Trackerr IA')).toBeInTheDocument();
    });

    const card = screen
      .getByText('Opinião Trackerr IA')
      .closest('[class*="rounded"]') as HTMLElement;

    expect(card.className).not.toContain('bg-gradient-to-br');
    expect(card.className).not.toContain('ring-1');
  });

  it('exibe o aviso de conteúdo gerado por IA', async () => {
    renderAssetDetail();

    await waitFor(() => {
      expect(screen.getByText(AI_GENERATED_NOTICE_TEXT)).toBeInTheDocument();
    });
  });
});
