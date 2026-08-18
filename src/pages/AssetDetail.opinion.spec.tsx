import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import AssetDetail from './AssetDetail';
import {AI_GENERATED_NOTICE_TEXT} from '@/components/ui/ai-generated-notice';

const getNationalStockMock = vi.fn();
const useSubscriptionMock = vi.fn();
const getAssetOpinionMock = vi.fn();

vi.mock('@/services/stocks', () => ({
  default: {
    getNationalStock: (...args: unknown[]) => getNationalStockMock(...args),
  },
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => useSubscriptionMock(),
}));

vi.mock('@/services/ai/assetOpinion', () => ({
  getAssetOpinion: (...args: unknown[]) => getAssetOpinionMock(...args),
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

describe('AssetDetail — card de Opinião Trackerr', () => {
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

  it('chama getAssetOpinion só com o symbol — o server busca o resto sozinho', async () => {
    useSubscriptionMock.mockReturnValue({hasAiInsights: true});
    getAssetOpinionMock.mockResolvedValue({
      symbol: 'BBDC4',
      summary: 'S',
      strength: 'F',
      attention: 'A',
      tags: [],
      scoreOverall: 50,
      status: 'ok',
    });

    renderAssetDetail();

    await waitFor(() => {
      expect(getAssetOpinionMock).toHaveBeenCalledWith('BBDC4');
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

  it('não exibe o aviso de IA para quem não tem acesso (texto local)', async () => {
    renderAssetDetail();

    await waitFor(() => {
      expect(screen.getByText('Opinião Trackerr IA')).toBeInTheDocument();
    });

    expect(getAssetOpinionMock).not.toHaveBeenCalled();
    expect(
      screen.getByText('Análise contextual indisponível no momento.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(AI_GENERATED_NOTICE_TEXT),
    ).not.toBeInTheDocument();
  });

  // AssetOpinionService (server) é determinístico — não existe mais
  // caminho, mockado ou real, em que o texto vem de um modelo (TRA-9).
  // Este teste trava a ausência do aviso em qualquer resposta que o
  // endpoint possa devolver hoje, não só no caso "sem acesso" acima.
  it('nunca exibe o aviso de conteúdo gerado por IA, com acesso e resposta ok', async () => {
    useSubscriptionMock.mockReturnValue({hasAiInsights: true});
    getAssetOpinionMock.mockResolvedValue({
      symbol: 'BBDC4',
      summary: 'BBDC4 apresenta qualidade sólida no padrão Trackerr (score 72/100).',
      strength: 'ROE acima de 15%',
      attention: 'Concentração acima do limite',
      tags: ['score_72', 'qualidade'],
      scoreOverall: 72,
      status: 'ok',
    });

    renderAssetDetail();

    await waitFor(() => {
      expect(
        screen.getByText(
          'BBDC4 apresenta qualidade sólida no padrão Trackerr (score 72/100).',
        ),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText(AI_GENERATED_NOTICE_TEXT),
    ).not.toBeInTheDocument();
  });
});
