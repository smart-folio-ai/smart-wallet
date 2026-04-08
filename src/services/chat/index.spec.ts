import {describe, it, expect, vi, beforeEach} from 'vitest';

const {chatMock} = vi.hoisted(() => ({
  chatMock: vi.fn(),
}));

vi.mock('@/services/ai', () => ({
  aiAnalysisService: {
    chat: chatMock,
  },
}));

import {askStructuredChat, normalizeChatResponse} from './index';

describe('chat service adapter', () => {
  beforeEach(() => {
    chatMock.mockReset();
  });

  it('normaliza resposta já estruturada', () => {
    const normalized = normalizeChatResponse({
      intent: 'portfolio_summary',
      deterministic: true,
      message: 'Resumo pronto',
      data: {portfolioSummary: {totalValue: 1000}},
    });

    expect(normalized.intent).toBe('portfolio_summary');
    expect(normalized.message).toBe('Resumo pronto');
    expect(normalized.deterministic).toBe(true);
  });

  it('normaliza JSON serializado retornado no campo answer', () => {
    const normalized = normalizeChatResponse({
      answer: JSON.stringify({
        intent: 'asset_comparison',
        deterministic: true,
        message: 'Comparação pronta',
        data: {comparison: {results: [{symbol: 'PETR4'}, {symbol: 'VALE3'}]}},
      }),
    });

    expect(normalized.intent).toBe('asset_comparison');
    expect(normalized.message).toBe('Comparação pronta');
    expect((normalized.data as any).comparison.results).toHaveLength(2);
  });

  it('degrada com segurança para resposta textual legada', () => {
    const normalized = normalizeChatResponse({
      answer: 'Resposta textual simples',
    });

    expect(normalized.intent).toBe('unknown');
    expect(normalized.deterministic).toBe(false);
    expect(normalized.route?.type).toBe('synthesis_required');
    expect(normalized.message).toBe('Resposta textual simples');
  });

  it('askStructuredChat delega ao provider de IA e retorna estrutura normalizada', async () => {
    chatMock.mockResolvedValueOnce({
      answer: JSON.stringify({
        intent: 'tax_estimation',
        deterministic: true,
        message: 'Imposto estimado',
        data: {sellSimulation: {estimatedTax: 150}},
      }),
    });

    const response = await askStructuredChat('Quanto imposto pago?');

    expect(chatMock).toHaveBeenCalledWith({question: 'Quanto imposto pago?'});
    expect(response.intent).toBe('tax_estimation');
    expect(response.message).toBe('Imposto estimado');
    expect((response.data as any).sellSimulation.estimatedTax).toBe(150);
  });
});
