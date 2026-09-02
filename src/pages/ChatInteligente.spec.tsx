import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import ChatInteligente from './ChatInteligente';
import {AI_GENERATED_NOTICE_TEXT} from '@/components/ui/ai-generated-notice';

const askStructuredChatMock = vi.fn();
const askStructuredCopilotChatMock = vi.fn();
const fetchChatHistoryMock = vi.fn();
const appendChatHistoryMessageMock = vi.fn();

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
  fetchChatHistory: (...args: unknown[]) => fetchChatHistoryMock(...args),
  appendChatHistoryMessage: (...args: unknown[]) =>
    appendChatHistoryMessageMock(...args),
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
    fetchChatHistoryMock.mockResolvedValue([]);
    appendChatHistoryMessageMock.mockResolvedValue({});
  });

  it('renders empty state and quick prompt chips', () => {
    renderPage();
    const emptyState = screen.getByTestId('chat-empty-state');
    const promptChips = screen.getByTestId('chat-prompt-chips');
    expect(emptyState).toBeDefined();
    expect(promptChips).toBeDefined();
    expect(within(emptyState).getByRole('button', {name: /Compare PETR4 e VALE3/i})).toBeDefined();
  });

  /**
   * Reportado em producao: "quais acoes com p/vp abaixo de 1.0?" recebia
   * "Valor total: R$ 11.933,23" e o Trackerr Score como resposta. A
   * pergunta caia em `unknown` no backend, que injeta carteira + score como
   * contexto pro LLM; sem texto do modelo, a tela exibia so esse contexto.
   */
  it('explains that market screening by indicator is not available', async () => {
    askStructuredChatMock.mockResolvedValueOnce({
      intent: 'market_screening',
      deterministic: true,
      message: '',
      route: {
        type: 'deterministic_no_llm',
        llmEligible: false,
        reason: 'capability_not_available',
      },
      data: {},
      unavailable: ['market_wide_fundamental_screening'],
      warnings: ['screening_requires_market_dataset'],
      assumptions: [],
    });

    renderPage();
    await userEvent.type(
      screen.getByLabelText('Pergunta do chat'),
      'quais acoes com p/vp abaixo de 1.0?',
    );
    await userEvent.click(screen.getByRole('button', {name: /Enviar/i}));

    await waitFor(() => {
      expect(
        screen.getByText(/não consigo filtrar ações do mercado por indicador/i),
      ).toBeDefined();
    });
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
        portfolioAssets: [
          {symbol: 'ITUB4', allocationPct: 40},
          {symbol: 'XPLG11', allocationPct: 20},
        ],
        comparison: {
          results: [{symbol: 'PETR4'}, {symbol: 'VALE3'}],
        },
        sellSimulation: {
          estimatedTax: 120.5,
        },
        portfolioRisk: {
          risk: {score: 71},
          concentrationByAsset: [{symbol: 'ITUB4', percentage: 40}],
        },
        rebalanceSuggestion: {
          profile: 'conservador',
          riskScore: {
            targetReductionPct: 20,
            targetSuggested: 56.8,
          },
          targetRanges: {
            maxAssetConcentrationPct: 18,
          },
          targetAllocationMix: [
            {bucket: 'Renda fixa BR (Tesouro/LCI/Prefixado)', targetPct: 45},
            {bucket: 'Ações Brasil', targetPct: 25},
          ],
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
      expect(screen.getByTestId('chat-block-rebalance-suggestion')).toBeDefined();
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
          recommended: [
            {symbol: 'ITUB4', reasons: ['ROE robusto sustentando qualidade.']},
          ],
          avoid: [
            {symbol: 'PETR4', reasons: ['Volatilidade de curto prazo elevada.']},
          ],
          criticalRisks: ['Concentração elevada em ITUB4 (35.2%).'],
          objectivePlan: ['Reduzir risco agregado da carteira no curto prazo.'],
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
      expect(screen.getByText(/Motivos \(top recomendações\)/i)).toBeDefined();
      expect(screen.getByText(/Motivos \(itens para evitar\)/i)).toBeDefined();
      expect(screen.getByText(/Riscos críticos/i)).toBeDefined();
      expect(screen.getByText(/Plano da semana/i)).toBeDefined();
    });
  });

  it('mostra o aviso de conteúdo gerado por IA quando o modelo sintetizou a resposta', async () => {
    askStructuredChatMock.mockResolvedValueOnce({
      intent: 'portfolio_summary',
      deterministic: false,
      route: {
        type: 'synthesis_required',
        llmEligible: true,
        reason: 'summary_needs_synthesis',
      },
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
      expect(screen.getByText(AI_GENERATED_NOTICE_TEXT)).toBeInTheDocument();
    });
  });

  // Os dois sinais de proveniência são checados de forma independente: se o
  // backend divergir e marcar só um deles, o aviso ainda precisa sumir.
  it.each([
    [
      'flag deterministic',
      {
        deterministic: true,
        route: {
          type: 'deterministic_no_llm' as const,
          llmEligible: false,
          reason: 'pure_calculation',
        },
      },
    ],
    [
      'rota deterministic_no_llm sem a flag',
      {
        deterministic: false,
        route: {
          type: 'deterministic_no_llm' as const,
          llmEligible: false,
          reason: 'pure_calculation',
        },
      },
    ],
    ['apenas a flag deterministic', {deterministic: true}],
  ])('não mostra o aviso de IA em resposta determinística (%s)', async (_case, provenance) => {
    askStructuredChatMock.mockResolvedValueOnce({
      intent: 'portfolio_summary',
      ...provenance,
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
      expect(screen.getByText('Resumo pronto.')).toBeInTheDocument();
    });
    expect(screen.queryByText(AI_GENERATED_NOTICE_TEXT)).not.toBeInTheDocument();
  });

  it('não mostra o aviso de IA quando o resumo é o literal do cliente', async () => {
    askStructuredChatMock.mockResolvedValueOnce({
      intent: 'portfolio_summary',
      deterministic: false,
      route: {
        type: 'synthesis_required',
        llmEligible: true,
        reason: 'summary_needs_synthesis',
      },
      message: '   ',
      data: {portfolioSummary: {totalValue: 1000}},
      warnings: [],
      unavailable: [],
      assumptions: [],
    });

    renderPage();
    await userEvent.type(screen.getByLabelText('Pergunta do chat'), 'Resumo');
    await userEvent.click(screen.getByRole('button', {name: /Enviar/i}));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Análise estruturada concluída com base nos dados disponíveis.',
        ),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(AI_GENERATED_NOTICE_TEXT)).not.toBeInTheDocument();
  });

  it('hydrates messages from the persisted chat history on mount', async () => {
    fetchChatHistoryMock.mockResolvedValue([
      {
        clientId: 'u-1',
        role: 'user',
        text: 'Minha carteira está concentrada?',
        status: 'ok',
      },
      {
        clientId: 'a-1',
        role: 'assistant',
        text: 'Sua carteira está bem distribuída.',
        status: 'ok',
        aiGenerated: true,
      },
    ]);

    renderPage();

    await waitFor(() => {
      expect(screen.queryByTestId('chat-empty-state')).toBeNull();
      expect(
        screen.getAllByText('Minha carteira está concentrada?').length,
      ).toBeGreaterThan(0);
      expect(
        screen.getByText('Sua carteira está bem distribuída.'),
      ).toBeInTheDocument();
    });
  });

  it('persists user and assistant messages when a question is sent', async () => {
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
      expect(appendChatHistoryMessageMock).toHaveBeenCalledTimes(2);
    });
    const persistedPayloads = appendChatHistoryMessageMock.mock.calls.map(
      (call) => call[0],
    );
    expect(persistedPayloads).toContainEqual(
      expect.objectContaining({role: 'user', text: 'Resumo', status: 'ok'}),
    );
    expect(persistedPayloads).toContainEqual(
      expect.objectContaining({
        role: 'assistant',
        text: 'Resumo pronto.',
        status: 'ok',
      }),
    );
  });
});
