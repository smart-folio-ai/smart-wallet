import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import RiInteligente from './RiInteligente';

const searchRiDocumentsMock = vi.fn();
const autocompleteRiAssetsMock = vi.fn();
const summarizeRiDocumentMock = vi.fn();
const useSubscriptionMock = vi.fn();

vi.mock('@/services/ri-intelligence', () => ({
  autocompleteRiAssets: (...args: unknown[]) => autocompleteRiAssetsMock(...args),
  searchRiDocuments: (...args: unknown[]) => searchRiDocumentsMock(...args),
  summarizeRiDocument: (...args: unknown[]) => summarizeRiDocumentMock(...args),
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => useSubscriptionMock(),
}));

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {retry: false},
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RiInteligente />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('RiInteligente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
      configurable: true,
      value: () => false,
    });
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
      configurable: true,
      value: () => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
      configurable: true,
      value: () => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: () => undefined,
    });
    useSubscriptionMock.mockReturnValue({
      planName: 'premium',
      isSubscribed: true,
    });
    autocompleteRiAssetsMock.mockResolvedValue([
      {ticker: 'BBDC4', company: 'Banco Bradesco S.A.'},
      {ticker: 'PETR4', company: 'Petróleo Brasileiro S.A. - Petrobras'},
    ]);
    searchRiDocumentsMock.mockResolvedValue({
      documents: [
        {
          id: 'doc-1',
          ticker: 'BBDC4',
          company: 'Bradesco',
          title: 'Release 4T25',
          documentType: 'earnings_release',
          period: '4T25',
          publishedAt: '2026-02-10T00:00:00.000Z',
          source: {type: 'url', value: 'https://example.com/doc.pdf'},
        },
      ],
      total: 1,
      warnings: [],
      fallback: {
        availableDocumentTypes: ['earnings_release'],
        suggestedFilters: ['all', 'earnings_release'],
      },
    });
  });

  it('lists recent valid releases and opens PDF', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/BBDC4 · Bradesco/i)).toBeDefined();
    });

    await userEvent.click(screen.getByRole('button', {name: /Abrir PDF/i}));
    expect(openSpy).toHaveBeenCalledWith(
      'https://example.com/doc.pdf',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('supports autocomplete by ticker and company search', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText('Busca de RI'), 'brad');
    await waitFor(() => {
      expect(screen.getByTestId('ri-autocomplete-list')).toBeDefined();
    });

    const autocompleteList = screen.getByTestId('ri-autocomplete-list');
    await userEvent.click(
      within(autocompleteList).getByRole('button', {name: /BBDC4/i}),
    );
    await waitFor(() => {
      expect(searchRiDocumentsMock).toHaveBeenCalledWith(
        expect.objectContaining({query: 'BBDC4'}),
      );
    });
  });

  it('refetches when selecting the same ticker suggestion again', async () => {
    renderPage();

    await userEvent.type(screen.getByLabelText('Busca de RI'), 'BBDC4');
    await userEvent.click(screen.getByTestId('ri-apply-search'));

    await waitFor(() => {
      expect(searchRiDocumentsMock).toHaveBeenCalledWith(
        expect.objectContaining({query: 'BBDC4'}),
      );
    });
    const callsAfterSearch = searchRiDocumentsMock.mock.calls.length;

    await waitFor(() => {
      expect(screen.getByTestId('ri-autocomplete-list')).toBeDefined();
    });
    const autocompleteList = screen.getByTestId('ri-autocomplete-list');
    await userEvent.click(
      within(autocompleteList).getByRole('button', {name: /BBDC4/i}),
    );

    await waitFor(() => {
      expect(searchRiDocumentsMock.mock.calls.length).toBeGreaterThan(callsAfterSearch);
    });
  });

  it('generates AI summary for premium plan', async () => {
    summarizeRiDocumentMock.mockResolvedValueOnce({
      document: {
        id: 'doc-1',
        ticker: 'BBDC4',
        company: 'Bradesco',
        documentType: 'earnings_release',
        period: '4T25',
        publishedAt: '2026-02-10T00:00:00.000Z',
      },
      summary: {
        status: 'ai_generated',
        highlights: ['Receita em alta', 'Lucro cresceu'],
        narrative: null,
        limitations: [],
        sourceLabel: 'ai_summary',
      },
      structuredSignals: {},
      cache: {key: 'x', hit: false, ttlSeconds: 1800},
      cost: {aiCalls: 1, tokenUsageEstimate: 200},
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/BBDC4 · Bradesco/i)).toBeDefined();
    });

    await userEvent.click(screen.getByRole('button', {name: /Selecionar/i}));
    await userEvent.click(screen.getByTestId('ri-generate-summary'));

    await waitFor(() => {
      expect(screen.getByText(/Receita em alta/i)).toBeDefined();
      expect(screen.getByText(/Fonte: ai_summary/i)).toBeDefined();
    });
  });

  it('applies plan gating for free users', async () => {
    useSubscriptionMock.mockReturnValue({
      planName: 'free',
      isSubscribed: false,
    });

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/BBDC4 · Bradesco/i)).toBeDefined();
    });

    expect(screen.getByText(/Resumo e comparação de release/i)).toBeDefined();
    expect(screen.getByText(/Disponível para planos Premium e Global Investor/i)).toBeDefined();
    expect(screen.getByTestId('ri-release-comparison-placeholder')).toBeDefined();
  });

  it('shows safe fallback when AI summary fails', async () => {
    summarizeRiDocumentMock.mockResolvedValueOnce({
      document: {
        id: 'doc-1',
        ticker: 'BBDC4',
        company: 'Bradesco',
        documentType: 'earnings_release',
        period: '4T25',
        publishedAt: '2026-02-10T00:00:00.000Z',
      },
      summary: {
        status: 'ai_failed',
        highlights: [],
        narrative: null,
        limitations: ['ri_ai_summary_failed'],
        sourceLabel: 'structured_fallback',
      },
      structuredSignals: {},
      cache: {key: null, hit: false, ttlSeconds: null},
      cost: {aiCalls: 1, tokenUsageEstimate: 0},
    });

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/BBDC4 · Bradesco/i)).toBeDefined();
    });

    await userEvent.click(screen.getByRole('button', {name: /Selecionar/i}));
    await userEvent.click(screen.getByTestId('ri-generate-summary'));

    await waitFor(() => {
      expect(screen.getByText(/Limitações: ri_ai_summary_failed/i)).toBeDefined();
    });
  });

  it('shows safe empty state when no valid recent release is found', async () => {
    searchRiDocumentsMock.mockResolvedValueOnce({
      documents: [],
      total: 0,
      warnings: ['ri_no_recent_releases_found', 'ri_no_valid_documents_found'],
      fallback: {
        availableDocumentTypes: [],
        suggestedFilters: ['all'],
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('ri-empty-state')).toBeDefined();
      expect(screen.getByTestId('ri-notice')).toBeDefined();
    });
  });

  it('shows friendly message and fallback when selected type is incompatible', async () => {
    searchRiDocumentsMock.mockResolvedValueOnce({
      documents: [],
      total: 0,
      warnings: ['ri_no_documents_for_selected_type'],
      fallback: {
        availableDocumentTypes: ['earnings_release'],
        suggestedFilters: ['all', 'earnings_release'],
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Nenhum documento neste tipo de filtro/i)).toBeDefined();
      expect(screen.getByTestId('ri-fallback-filter-earnings_release')).toBeDefined();
    });
  });

  it('shows friendly message when ticker has no RI documents', async () => {
    searchRiDocumentsMock.mockResolvedValueOnce({
      documents: [],
      total: 0,
      warnings: ['ri_no_documents_found'],
      fallback: {
        availableDocumentTypes: [],
        suggestedFilters: ['all'],
      },
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Nenhum documento encontrado para este ticker/i)).toBeDefined();
      expect(screen.queryByText(/ri_no_documents_found/i)).toBeNull();
    });
  });
});
