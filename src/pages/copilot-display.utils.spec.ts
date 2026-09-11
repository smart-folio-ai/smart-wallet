import {describe, it, expect} from 'vitest';
import type {PortfolioReturns} from '@/hooks/usePortfolioReturns';
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

const returns = {
  from: '2025-01-02',
  to: '2025-12-30',
  contribution: {currentValue: 1284930, contributed: 1e6, marketGain: 284930, marketGainPct: 0.28},
  twr: {value: 0.171, annualized: 0.171, periods: 240},
  irr: 0.18,
  benchmark: {
    symbol: '^BVSP',
    beta: 0.86,
    trackingError: 0.064,
    correlation: 0.8,
    observations: 240,
    portfolioReturn: 0.287,
    benchmarkReturn: 0.146,
    alpha: 0.141,
  },
  risk: {
    sharpe: {sharpe: 1.42, riskFreeAnnual: 0.102, observations: 240},
    valueAtRisk: {
      varPct: 0.032,
      amount: 41180,
      cvarPct: 0.04,
      cvarAmount: 51000,
      horizonDays: 21,
      confidence: 0.95,
      windows: 220,
    },
    drawdown: {maxDrawdown: -0.142, peakDate: null, troughDate: null, durationDays: null, recoveryDate: null},
  },
  unavailable: [],
  staleDays: 0,
} as PortfolioReturns;

describe('buildCopilotMetrics — análises', () => {
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

  it('monta tiles do desvio da meta na convenção do handoff', () => {
    const metrics = buildCopilotMetrics(
      {
        rebalancing: {
          hasTarget: true,
          totalDriftPct: 12.4,
          largestGap: {bucket: 'stocks', currentPct: 56.2, targetPct: 50, gapPct: -6.2, amount: -48900},
        },
      },
      {intent: 'allocation_gap'},
    );

    expect(metrics[0]).toEqual({label: 'Maior desvio', value: '+6,2 p.p. em Ações'});
    expect(metrics[1].value).toMatch(/^R\$\s?48\.900$/);
    expect(metrics[2]).toEqual({label: 'Desvio total', value: '12,4 p.p.'});
  });

  it('monta tiles do aporte por classe', () => {
    const metrics = buildCopilotMetrics({
      contributionSimulation: {
        contribution: 20000,
        slices: [{bucket: 'fiis', amount: 20000, resultingPct: 50, targetPct: 50}],
      },
    });

    expect(metrics).toHaveLength(1);
    expect(metrics[0].label).toBe('FIIs');
    expect(metrics[0].value).toMatch(/^R\$\s?20\.000$/);
  });

  it('usa os rótulos do card de proventos do handoff', () => {
    const metrics = buildCopilotMetrics({
      dividendsReceived: {total12m: 74220, yieldOnCost: 0.0742, topPayers: []},
    });

    expect(metrics.map((metric) => metric.label)).toEqual([
      'Recebido 12M',
      'Média mensal',
      'Yield on cost',
    ]);
    expect(metrics[2].value).toBe('7,42%');
  });

  // Sem dado, sem tile — "N/D" seria ruído com cara de número.
  it('não gera tiles sem análise ou sem dado', () => {
    expect(buildCopilotMetrics(undefined)).toEqual([]);
    expect(buildCopilotMetrics({comparison: {}})).toEqual([]);
    expect(buildCopilotMetrics({correlationMatrix: {averageCorrelation: null}})).toEqual([]);
  });
});

describe('buildCopilotMetrics — risco por nível (CHAT.metrics do handoff)', () => {
  const riskPayload = {
    portfolioSummary: {totalValue: 1284930},
    portfolioRisk: {concentrationByAsset: [{symbol: 'PETR4', weightPct: 10.9}]},
  };

  it('iniciante: Você tem, Rendeu 12M, Maior ativo', () => {
    const metrics = buildCopilotMetrics(riskPayload, {
      intent: 'portfolio_risk',
      level: 'iniciante',
      returns,
    });

    expect(metrics.map((metric) => metric.label)).toEqual(['Você tem', 'Rendeu 12M', 'Maior ativo']);
    expect(metrics[1].value).toBe('+28,7%');
    expect(metrics[2].value).toBe('10,9%');
  });

  it('intermediário: Retorno 12M, Alpha vs IBOV, Beta', () => {
    const metrics = buildCopilotMetrics(riskPayload, {
      intent: 'portfolio_risk',
      level: 'intermediario',
      returns,
    });

    expect(metrics).toEqual([
      {label: 'Retorno 12M', value: '+28,7%'},
      {label: 'Alpha vs IBOV', value: '+14,1 p.p.'},
      {label: 'Beta', value: '0,86'},
    ]);
  });

  it('avançado: VaR 95% 21d, Sharpe, Tracking error', () => {
    const metrics = buildCopilotMetrics(riskPayload, {
      intent: 'portfolio_risk',
      level: 'avancado',
      returns,
    });

    expect(metrics).toEqual([
      {label: 'VaR 95% 21d', value: 'R$ 41,2k'},
      {label: 'Sharpe', value: '1,42'},
      {label: 'Tracking error', value: '6,4%'},
    ]);
  });

  it('omite tiles sem retorno calculado', () => {
    const metrics = buildCopilotMetrics(riskPayload, {
      intent: 'portfolio_risk',
      level: 'avancado',
      returns: undefined,
    });

    expect(metrics).toEqual([]);
  });
});
