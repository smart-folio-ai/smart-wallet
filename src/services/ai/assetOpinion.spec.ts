import {beforeEach, describe, expect, it, vi} from 'vitest';

const {chatMock} = vi.hoisted(() => ({
  chatMock: vi.fn(),
}));

vi.mock('@/services/ai', () => ({
  aiAnalysisService: {
    chat: chatMock,
  },
}));

import {getAssetOpinion, parseAssetOpinion} from './assetOpinion';

describe('assetOpinion service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parseia JSON válido da resposta da IA', () => {
    const parsed = parseAssetOpinion(
      '{"summary":"Resumo real","strength":"Caixa forte","attention":"Dívida alta","tags":["atenção","volatilidade"]}',
    );

    expect(parsed).toEqual({
      summary: 'Resumo real',
      strength: 'Caixa forte',
      attention: 'Dívida alta',
      tags: ['atenção', 'volatilidade'],
    });
  });

  it('parseia JSON dentro de bloco markdown', () => {
    const parsed = parseAssetOpinion(
      '```json\n{"summary":"S","strength":"F","attention":"A","tags":["x"]}\n```',
    );

    expect(parsed?.summary).toBe('S');
    expect(parsed?.strength).toBe('F');
    expect(parsed?.attention).toBe('A');
    expect(parsed?.tags).toEqual(['x']);
  });

  it('retorna null quando a resposta não contém JSON válido', () => {
    expect(parseAssetOpinion('Resposta sem estrutura JSON')).toBeNull();
  });

  it('retorna fallback seguro quando a IA falha', async () => {
    chatMock.mockRejectedValueOnce(new Error('timeout'));

    const opinion = await getAssetOpinion({
      symbol: 'AMER3',
      indicators: {
        roe: 0.02,
        dividendYield: 0.01,
        debtEbitda: 4,
      },
    });

    expect(opinion.summary).toContain('score');
    expect(opinion.summary).toContain('AMER3');
    expect(opinion.tags).toContain('venda');
  });

  it('usa resultado parseado quando a IA responde corretamente', async () => {
    chatMock.mockResolvedValueOnce({
      answer:
        '{"summary":"Dados fracos no período","strength":"Melhora operacional recente","attention":"Alavancagem elevada","tags":["alavancagem","turnaround"]}',
    });

    const opinion = await getAssetOpinion({
      symbol: 'AMER3',
      price: 1.23,
    });

    expect(opinion.summary).toBe('Dados fracos no período');
    expect(opinion.strength).toBe('Melhora operacional recente');
    expect(opinion.attention).toBe('Alavancagem elevada');
    expect(opinion.tags).toEqual(['alavancagem', 'turnaround']);
    expect(chatMock).toHaveBeenCalledTimes(1);
  });
});
