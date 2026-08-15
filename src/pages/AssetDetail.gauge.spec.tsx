import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor, within} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import AssetDetail from './AssetDetail';

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

describe('AssetDetail — gauge do Preço Justo', () => {
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

  // The page renders several lucide-react icons as <svg> before the gauge
  // (back arrow, trend arrows, etc.), so `container.querySelector('svg')`
  // alone would grab one of those instead of the gauge. The gauge is the
  // only svg with this viewBox (set in the GrahamGauge component), so we
  // select it explicitly.
  const getGaugeSvg = (container: HTMLElement) =>
    container.querySelector('svg[viewBox="0 0 240 130"]');

  it('não desenha rótulos dentro do arco', async () => {
    const {container} = renderAssetDetail();

    await waitFor(() => {
      expect(getGaugeSvg(container)).not.toBeNull();
    });

    const gaugeSvg = getGaugeSvg(container);
    expect(gaugeSvg?.querySelectorAll('text')).toHaveLength(0);
  });

  it('mantém a legenda abaixo do gauge com as quatro palavras por extenso', async () => {
    renderAssetDetail();

    await waitFor(() => {
      expect(screen.getByText('Sobrevalorizada')).toBeInTheDocument();
    });

    // Scope to the legend grid itself: "Atenção" also appears as a heading
    // in the (always-rendered, sometimes-blurred) Trackerr IA opinion card,
    // so an unscoped getByText would find two matches.
    const legend = screen.getByText('Sobrevalorizada').closest('.grid');
    expect(legend).not.toBeNull();
    expect(within(legend as HTMLElement).getByText('Atenção')).toBeInTheDocument();
    expect(within(legend as HTMLElement).getByText('Neutra')).toBeInTheDocument();
    expect(
      within(legend as HTMLElement).getByText('Oportunidade'),
    ).toBeInTheDocument();
  });

  it('mantém os quatro segmentos coloridos do arco', async () => {
    const {container} = renderAssetDetail();

    await waitFor(() => {
      expect(getGaugeSvg(container)).not.toBeNull();
    });

    const strokes = Array.from(
      getGaugeSvg(container)?.querySelectorAll('path') ?? [],
    ).map((path) => path.getAttribute('stroke'));

    expect(strokes).toEqual(
      expect.arrayContaining(['#f43f5e', '#facc15', '#3b82f6', '#22c55e']),
    );
  });
});
