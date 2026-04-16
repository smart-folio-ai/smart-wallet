import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import ChatInteligente from './ChatInteligente';

const askStructuredChatMock = vi.fn();
const askStructuredCopilotChatMock = vi.fn();

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    planName: 'pro',
    isSubscribed: true,
    isLoading: false,
  }),
}));

vi.mock('@/services/chat', () => ({
  askStructuredChat: (...args: unknown[]) => askStructuredChatMock(...args),
  askStructuredCopilotChat: (...args: unknown[]) =>
    askStructuredCopilotChatMock(...args),
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
        <ChatInteligente />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ChatInteligente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state and quick prompt chips', () => {
    renderPage();
    const emptyState = screen.getByTestId('chat-empty-state');
    const promptChips = screen.getByTestId('chat-prompt-chips');
    expect(emptyState).toBeDefined();
    expect(promptChips).toBeDefined();
    expect(within(emptyState).getByRole('button', {name: /Compare PETR4 e VALE3/i})).toBeDefined();
  });

  it('renders user and assistant messages with structured blocks', async () => {
    askStructuredChatMock.mockResolvedValueOnce({
      intent: 'tax_estimation',
      deterministic: true,
      message: 'Simulação concluída.',
      data: {
        portfolioSummary: {
          totalValue: 250000,
        },
        comparison: {
          results: [{symbol: 'PETR4'}, {symbol: 'VALE3'}],
        },
        sellSimulation: {
          estimatedTax: 120.5,
        },
        portfolioRisk: {
          risk: {score: 71},
        },
        externalAsset: {
          symbol: 'AAPL',
          price: 1010.5,
        },
        suggestions: ['Reduzir exposição em renda variável'],
      },
      warnings: ['Sem dividendos completos'],
      unavailable: ['Setor indisponível'],
      assumptions: [],
    });

    renderPage();
    await userEvent.type(screen.getByLabelText('Pergunta do chat'), 'Quanto imposto pago?');
    await userEvent.click(screen.getByRole('button', {name: /Enviar/i}));

    await waitFor(() => {
      expect(screen.getAllByTestId('chat-message-user').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('chat-message-assistant').length).toBeGreaterThan(0);
      expect(screen.getByTestId('chat-assistant-summary')).toBeDefined();
      expect(screen.getByTestId('chat-evidence-badges')).toBeDefined();
      expect(screen.getByTestId('chat-structured-details')).toBeDefined();
      expect(screen.getByTestId('chat-block-portfolio-summary')).toBeDefined();
      expect(screen.getByTestId('chat-block-comparison')).toBeDefined();
      expect(screen.getByTestId('chat-block-tax-result')).toBeDefined();
      expect(screen.getByTestId('chat-block-risk')).toBeDefined();
      expect(screen.getByTestId('chat-block-external-asset')).toBeDefined();
      expect(screen.getByTestId('chat-block-warnings')).toBeDefined();
      expect(screen.getByTestId('chat-block-unavailable')).toBeDefined();
      expect(screen.getByTestId('chat-block-suggestions')).toBeDefined();
      expect(screen.getByText(/Resposta da Carteira/i)).toBeDefined();
      expect(screen.getByText(/Comparação/i)).toBeDefined();
      expect(screen.getByText(/Imposto \/ Simulação/i)).toBeDefined();
      expect(screen.getByText(/^Risco$/i)).toBeDefined();
      expect(screen.getByText(/Ativo Fora da Carteira/i)).toBeDefined();
      expect(screen.getByText(/Limitações de Dados/i)).toBeDefined();
    });
  });

  it('shows loading state while waiting assistant response', async () => {
    askStructuredChatMock.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                intent: 'portfolio_summary',
                deterministic: true,
                message: 'Resumo pronto.',
                data: {portfolioSummary: {totalValue: 1000}},
                warnings: [],
                unavailable: [],
                assumptions: [],
              }),
            50,
          ),
        ),
    );

    renderPage();
    await userEvent.type(screen.getByLabelText('Pergunta do chat'), 'Resumo');
    await userEvent.click(screen.getByRole('button', {name: /Enviar/i}));

    expect(screen.getByTestId('chat-loading')).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByTestId('chat-loading')).toBeNull();
    });
  });

  it('supports retry flow when chat request fails', async () => {
    askStructuredChatMock.mockRejectedValueOnce(new Error('boom'));
    askStructuredChatMock.mockResolvedValueOnce({
      intent: 'portfolio_summary',
      deterministic: true,
      message: 'Resumo após retry.',
      data: {portfolioSummary: {totalValue: 1000}},
      warnings: [],
      unavailable: [],
      assumptions: [],
    });

    renderPage();
    await userEvent.type(screen.getByLabelText('Pergunta do chat'), 'Resumo da carteira');
    await userEvent.click(screen.getByRole('button', {name: /Enviar/i}));

    await waitFor(() => {
      expect(screen.getByRole('button', {name: /Tentar novamente/i})).toBeDefined();
    });

    await userEvent.click(screen.getByRole('button', {name: /Tentar novamente/i}));
    await waitFor(() => {
      expect(screen.getByText(/Resumo após retry/i)).toBeDefined();
    });
  });

  it('sends prompt chip question when clicked', async () => {
    askStructuredChatMock.mockResolvedValueOnce({
      intent: 'asset_comparison',
      deterministic: true,
      message: 'Comparação concluída.',
      data: {
        comparison: {
          results: [{symbol: 'PETR4'}, {symbol: 'VALE3'}],
        },
      },
      warnings: [],
      unavailable: [],
      assumptions: [],
    });

    renderPage();
    const emptyState = screen.getByTestId('chat-empty-state');
    await userEvent.click(within(emptyState).getByRole('button', {name: /Compare PETR4 e VALE3/i}));

    await waitFor(() => {
      expect(askStructuredChatMock).toHaveBeenCalledWith('Compare PETR4 e VALE3');
      expect(screen.getByText(/Comparação concluída/i)).toBeDefined();
    });
  });

  it('auto-scrolls when new messages are added', async () => {
    const scrollSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollSpy,
    });

    askStructuredChatMock.mockResolvedValueOnce({
      intent: 'portfolio_summary',
      deterministic: true,
      message: 'Resumo pronto.',
      data: {portfolioSummary: {totalValue: 1000}},
      warnings: [],
      unavailable: [],
      assumptions: [],
    });

    renderPage();
    await userEvent.type(screen.getByLabelText('Pergunta do chat'), 'Resumo');
    await userEvent.click(screen.getByRole('button', {name: /Enviar/i}));

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalled();
    });
  });

  it('uses guided copilot flow buttons', async () => {
    askStructuredCopilotChatMock.mockResolvedValueOnce({
      intent: 'investment_committee',
      deterministic: true,
      message: 'Comitê semanal gerado.',
      data: {
        investmentCommittee: {
          modelVersion: 'investment_committee_v1',
          recommended: [{symbol: 'ITUB4'}],
          avoid: [{symbol: 'PETR4'}],
        },
      },
      warnings: [],
      unavailable: [],
      assumptions: [],
    });

    renderPage();
    await userEvent.click(screen.getByRole('button', {name: /Gerar comitê semanal/i}));

    await waitFor(() => {
      expect(askStructuredCopilotChatMock).toHaveBeenCalledWith(
        expect.objectContaining({
          question: 'Gerar comitê de investimento semanal',
          copilotFlow: 'committee_mode',
        }),
      );
      expect(screen.getByText(/Comitê semanal gerado/i)).toBeDefined();
    });
  });
});
