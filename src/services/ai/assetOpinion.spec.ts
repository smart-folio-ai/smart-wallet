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
      source: 'ai',
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
    expect(opinion.source).toBe('deterministic');
  });

  it('pula o check quando o indicador é null, em vez de reprová-lo como um zero real', async () => {
    chatMock.mockRejectedValue(new Error('timeout'));

    const semDado = await getAssetOpinion({
      symbol: 'BBAS3',
      indicators: {roe: null, dividendYield: 0.08},
    });

    const zeroReal = await getAssetOpinion({
      symbol: 'BBAS3',
      indicators: {roe: 0, dividendYield: 0.08},
    });

    // `null` = sem dado: só o DY entra na conta, e ele passa -> 100.
    expect(semDado.tags).toContain('score_100');
    // `0` = medição real: o ROE entra e reprova -> a nota cai.
    expect(zeroReal.tags).toContain('score_43');
    expect(semDado.tags).not.toEqual(zeroReal.tags);
  });

  it('null não vira 0 no contexto enviado para a IA', async () => {
    chatMock.mockResolvedValueOnce({answer: 'texto livre'});

    await getAssetOpinion({
      symbol: 'BBAS3',
      indicators: {roic: null, netMargin: null, roe: 0.2},
    });

    const context = chatMock.mock.calls[0][0].context as any;
    expect(context.asset.indicators.roic).toBeNull();
    expect(context.asset.indicators.netMargin).toBeNull();
    expect(context.asset.indicators.roic).not.toBe(0);
  });

  it('marca como determinístico quando a IA responde fora do formato', async () => {
    chatMock.mockResolvedValueOnce({answer: 'texto livre sem JSON'});

    const opinion = await getAssetOpinion({
      symbol: 'AMER3',
      indicators: {roe: 0.02},
    });

    expect(opinion.source).toBe('deterministic');
    expect(opinion.summary).toContain('AMER3');
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
    expect(opinion.source).toBe('ai');
    expect(chatMock).toHaveBeenCalledTimes(1);
  });
});
