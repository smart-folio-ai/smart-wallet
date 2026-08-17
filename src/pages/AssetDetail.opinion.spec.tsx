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

  it('envia null (nao 0) para o indicador ausente na resposta da API', async () => {
    useSubscriptionMock.mockReturnValue({hasAiInsights: true});
    getAssetOpinionMock.mockResolvedValue({
      summary: 'S',
      strength: 'F',
      attention: 'A',
      tags: [],
      source: 'deterministic',
    });

    renderAssetDetail();

    await waitFor(() => {
      expect(getAssetOpinionMock).toHaveBeenCalled();
    });

    // A resposta mockada nao traz returnOnInvestedCapital nem netMargin.
    const payload = getAssetOpinionMock.mock.calls[0][0] as any;
    expect(payload.indicators.roic).toBeNull();
    expect(payload.indicators.roic).not.toBe(0);
    expect(payload.indicators.netMargin).toBeNull();
    expect(payload.indicators.netMargin).not.toBe(0);
    // A resposta mockada tambem nao traz dividendYield — mesma classe de bug
    // do PR #72, mas fora do bloco `indicators` (TRA-49).
    expect(payload.indicators.dividendYield).toBeNull();
    expect(payload.indicators.dividendYield).not.toBe(0);
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

  it('não exibe o aviso de IA quando o texto é o fallback determinístico', async () => {
    useSubscriptionMock.mockReturnValue({hasAiInsights: true});
    getAssetOpinionMock.mockResolvedValue({
      summary: 'BBDC4 apresenta qualidade intermediária no padrão Trackerr.',
      strength: 'ROE > 15%',
      attention: 'A relação risco-retorno pede cautela.',
      tags: ['score_50'],
      source: 'deterministic',
    });

    renderAssetDetail();

    await waitFor(() => {
      expect(
        screen.getByText(
          'BBDC4 apresenta qualidade intermediária no padrão Trackerr.',
        ),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText(AI_GENERATED_NOTICE_TEXT),
    ).not.toBeInTheDocument();
  });

  it('exibe o aviso de IA quando o modelo escreveu o texto', async () => {
    useSubscriptionMock.mockReturnValue({hasAiInsights: true});
    getAssetOpinionMock.mockResolvedValue({
      summary: 'Resumo escrito pelo modelo.',
      strength: 'Ponto forte do modelo.',
      attention: 'Ponto de atenção do modelo.',
      tags: ['qualidade'],
      source: 'ai',
    });

    renderAssetDetail();

    await waitFor(() => {
      expect(screen.getByText(AI_GENERATED_NOTICE_TEXT)).toBeInTheDocument();
    });
  });
});
