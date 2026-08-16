import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import AssetDetail from './AssetDetail';
import {
  INDICATOR_UNAVAILABLE_TEXT,
  INDICATOR_NOT_APPLICABLE_TEXT,
} from '@/components/asset/indicator-item';

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

const renderAssetDetailWith = ({
  symbol,
  fundamentals,
}: {
  symbol: string;
  fundamentals: unknown;
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false},
    },
  });

  getNationalStockMock.mockResolvedValue({
    results: [
      {
        symbol,
        longName: symbol,
        shortName: symbol,
        regularMarketPrice: 20,
        regularMarketChangePercent: 1.5,
        regularMarketChange: 0.3,
        epsTrailingTwelveMonths: 2,
        bookValuePerShare: 15,
        priceToBook: 1.3,
        historicalDataPrice: [],
        dividendsData: {cashDividends: []},
        fundamentals,
      },
    ],
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/asset/${symbol}`]}>
        <Routes>
          <Route path="/asset/:symbol" element={<AssetDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('AssetDetail — card de Indicadores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSubscriptionMock.mockReturnValue({
      hasAiInsights: false,
    });
  });

  const BANCO = {
    symbol: 'BBAS3',
    sector: 'Intermediários Financeiros',
    mixed: false,
    values: {
      roic: {status: 'not_applicable', value: null, source: null},
      netMargin: {status: 'not_applicable', value: null, source: null},
      netDebt: {status: 'not_applicable', value: null, source: null},
      payout: {status: 'unavailable', value: null, source: null},
    },
  };

  it('mostra "Não se aplica" no ROIC de banco, e nunca 0', async () => {
    renderAssetDetailWith({symbol: 'BBAS3', fundamentals: BANCO});

    const card = await screen.findByTestId('indicators-card');
    const linha = within(card).getByText('ROIC').closest('div')
      ?.parentElement as HTMLElement;

    expect(within(linha).getByText(INDICATOR_NOT_APPLICABLE_TEXT)).toBeInTheDocument();
    expect(within(card).queryByText('0,00%')).not.toBeInTheDocument();
    expect(within(card).queryByText('0.00%')).not.toBeInTheDocument();
  });

  it('nunca renderiza o payout fixo de 65%', async () => {
    renderAssetDetailWith({symbol: 'BBAS3', fundamentals: BANCO});

    const card = await screen.findByTestId('indicators-card');
    expect(within(card).queryByText('65,00%')).not.toBeInTheDocument();
    expect(within(card).queryByText('65.00%')).not.toBeInTheDocument();
  });

  it('mostra valor com origem para nao banco', async () => {
    renderAssetDetailWith({
      symbol: 'WEGE3',
      fundamentals: {
        symbol: 'WEGE3',
        sector: 'Máquinas e Equipamentos',
        mixed: false,
        values: {
          roic: {status: 'ok', value: 24.3, source: 'fundamentus'},
        },
      },
    });

    const card = await screen.findByTestId('indicators-card');
    expect(within(card).getByText(/24,3|24\.3/)).toBeInTheDocument();
    expect(within(card).getByText(/fundamentus/i)).toBeInTheDocument();
  });

  it('mostra o traco quando o server nao devolve fundamentos', async () => {
    renderAssetDetailWith({symbol: 'XPTO3', fundamentals: null});

    const card = await screen.findByTestId('indicators-card');
    expect(within(card).getAllByText(INDICATOR_UNAVAILABLE_TEXT).length).toBeGreaterThan(0);
  });

  it('o badge REAL-TIME nao aparece mais no card', async () => {
    renderAssetDetailWith({symbol: 'WEGE3', fundamentals: null});

    const card = await screen.findByTestId('indicators-card');
    expect(within(card).queryByText('REAL-TIME')).not.toBeInTheDocument();
  });

  it('renomeia a linha de divida liquida e formata como moeda, nao como razao', async () => {
    renderAssetDetailWith({
      symbol: 'WEGE3',
      fundamentals: {
        symbol: 'WEGE3',
        sector: 'Máquinas e Equipamentos',
        mixed: false,
        values: {
          netDebt: {status: 'ok', value: -3734800000, source: 'fundamentus'},
        },
      },
    });

    const card = await screen.findByTestId('indicators-card');
    expect(within(card).getByText('DÍVIDA LÍQUIDA')).toBeInTheDocument();
    expect(within(card).queryByText(/DÍVIDA LÍQ \/ EBITDA/)).not.toBeInTheDocument();
  });
});
