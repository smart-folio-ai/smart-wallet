import {describe, it, expect} from 'vitest';
import {
  buildCopilotMetrics,
  COPILOT_PROMPTS,
  copilotModeLabel,
} from './copilot-display.utils';

describe('COPILOT_PROMPTS', () => {
  // Texto literal do protótipo App do handoff — o servidor roteia por ele.
  it('reproduz os prompts do handoff por nível', () => {
    expect(COPILOT_PROMPTS.iniciante).toContain('O que é diversificação?');
    expect(COPILOT_PROMPTS.intermediario).toContain('Comparar com o IBOV');
    expect(COPILOT_PROMPTS.avancado).toEqual([
      'Decompor o VaR por fator',
      'Matriz de correlação',
      'Otimizar carry fiscal até dez',
      'Atribuição de retorno 12M',
    ]);
  });
});

describe('copilotModeLabel', () => {
  it('descreve o modo de resposta do nível', () => {
    expect(copilotModeLabel('iniciante')).toBe(
      'Respondendo em modo Iniciante · linguagem simples, sem jargão',
    );
    expect(copilotModeLabel('avancado')).toContain('métricas quantitativas');
  });
});

describe('buildCopilotMetrics', () => {
  it('monta tiles da matriz de correlação', () => {
    const metrics = buildCopilotMetrics({
      correlationMatrix: {
        averageCorrelation: 0.4213,
        highestPair: {a: 'ITUB4', b: 'BBDC4', correlation: 0.82},
        lowestPair: {a: 'PETR4', b: 'XPLG11', correlation: -0.1},
      },
    });

    expect(metrics).toEqual([
      {label: 'Correlação média', value: '0,42'},
      {label: 'ITUB4 × BBDC4', value: '0,82'},
      {label: 'PETR4 × XPLG11', value: '-0,10'},
    ]);
  });

  it('monta tiles da atribuição em % e p.p.', () => {
    const metrics = buildCopilotMetrics({
      returnAttribution: {
        totalReturn: 0.171,
        topContributor: {symbol: 'ITUB4', contribution: 0.062},
        topDetractor: {symbol: 'PETR4', contribution: -0.018},
      },
    });

    expect(metrics).toEqual([
      {label: 'Retorno 12M', value: '+17,1%'},
      {label: 'Maior contribuição · ITUB4', value: '+6,2 p.p.'},
      {label: 'Maior detrator · PETR4', value: '-1,8 p.p.'},
    ]);
  });

  // Sem dado, sem tile — "N/D" seria ruído com cara de número.
  it('não gera tiles sem análise ou sem dado', () => {
    expect(buildCopilotMetrics(undefined)).toEqual([]);
    expect(buildCopilotMetrics({comparison: {}})).toEqual([]);
    expect(
      buildCopilotMetrics({correlationMatrix: {averageCorrelation: null}}),
    ).toEqual([]);
  });
});
