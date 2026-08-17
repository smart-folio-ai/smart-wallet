import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, within} from '@testing-library/react';
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

const BANK_CAPITAL = {
  symbol: 'BBAS3',
  bankName: 'Banco do Brasil',
  period: '2026-03',
  basileia: 14.23,
  imobilizacao: 20.5,
};

const renderAssetDetailWith = ({
  symbol,
  bankCapital,
  restrictedData,
}: {
  symbol: string;
  bankCapital: unknown;
  restrictedData?: string[];
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
        bankCapital,
        restrictedData,
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

describe('AssetDetail — card de indicadores de capital bancario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSubscriptionMock.mockReturnValue({
      hasAiInsights: false,
    });
  });

  it('renderiza o card quando bankCapital existe', async () => {
    renderAssetDetailWith({symbol: 'BBAS3', bankCapital: BANK_CAPITAL});

    const card = await screen.findByTestId('bank-capital-card');
    expect(within(card).getByText(/Banco do Brasil/)).toBeInTheDocument();
    expect(within(card).getByText(/14,23%/)).toBeInTheDocument();
    expect(within(card).getByText(/20,50%/)).toBeInTheDocument();
  });

  it('mostra o trimestre de referencia no cabecalho do card', async () => {
    renderAssetDetailWith({symbol: 'BBAS3', bankCapital: BANK_CAPITAL});

    const card = await screen.findByTestId('bank-capital-card');
    expect(within(card).getByText(/1º tri\/2026/)).toBeInTheDocument();
  });

  it('mostra o trimestre mesmo quando os dois indices estao ausentes', async () => {
    renderAssetDetailWith({
      symbol: 'BBAS3',
      bankCapital: {...BANK_CAPITAL, basileia: null, imobilizacao: null},
    });

    const card = await screen.findByTestId('bank-capital-card');
    expect(within(card).queryByText(/Índice de Basileia de/)).not.toBeInTheDocument();
    expect(within(card).getByText(/1º tri\/2026/)).toBeInTheDocument();
  });

  it('nao quebra a pagina quando o payload chega parcial, com undefined', async () => {
    renderAssetDetailWith({
      symbol: 'BBAS3',
      bankCapital: {symbol: 'BBAS3', bankName: 'Banco do Brasil', period: '2026-03'},
    });

    const card = await screen.findByTestId('bank-capital-card');
    expect(within(card).getAllByText('—')).toHaveLength(2);
    expect(screen.getByTestId('indicators-card')).toBeInTheDocument();
  });

  it('nao renderiza o card quando bankCapital e null', async () => {
    renderAssetDetailWith({symbol: 'PETR4', bankCapital: null});

    await screen.findByTestId('indicators-card');
    expect(screen.queryByTestId('bank-capital-card')).not.toBeInTheDocument();
  });

  it('nao passa nenhuma prop de restricao para os gauges', async () => {
    renderAssetDetailWith({
      symbol: 'BBAS3',
      bankCapital: BANK_CAPITAL,
      restrictedData: ['fundamental', 'dividends'],
    });

    const card = await screen.findByTestId('bank-capital-card');
    expect(within(card).queryByText('EM BREVE')).not.toBeInTheDocument();
    expect(within(card).getByText(/14,23%/)).toBeInTheDocument();
  });

  it('mostra a frase de resumo com os numeros reais', async () => {
    renderAssetDetailWith({symbol: 'BBAS3', bankCapital: BANK_CAPITAL});

    const card = await screen.findByTestId('bank-capital-card');
    expect(within(card).getByText(/Índice de Basileia de 14,2%/)).toBeInTheDocument();
    expect(
      within(card).getByText(/Índice de Imobilização de 20,5%, dentro do limite regulatório de 50%/),
    ).toBeInTheDocument();
  });

  it('nao mostra AiGeneratedNotice neste card', async () => {
    renderAssetDetailWith({symbol: 'BBAS3', bankCapital: BANK_CAPITAL});

    const card = await screen.findByTestId('bank-capital-card');
    expect(
      within(card).queryByText('Esse texto foi gerado com o auxílio de inteligência artificial.'),
    ).not.toBeInTheDocument();
  });
});
