import {describe, expect, it} from 'vitest';

import {
  buildDashboardEventsFeed,
  buildRecommendedActionsQueue,
  buildRiskSnapshot,
} from './dashboard-insights.utils';

describe('dashboard-insights.utils', () => {
  it('buildRecommendedActionsQueue cria fila densa de decisões', () => {
    const actions = buildRecommendedActionsQueue({
      concentrationName: 'Ações',
      concentrationValue: 69.28,
      taxSimulationSymbol: 'BBAS3',
      taxSimulationSavings: 1200,
      hasTargetAllocation: false,
      riSymbol: 'VALE3',
      internationalExposurePct: 12.45,
      dollarVariationPct: 0.82,
    });

    expect(actions).toHaveLength(5);
    expect(actions.map((item) => item.title)).toEqual([
      'Revisar concentração da carteira',
      'Simular venda de BBAS3',
      'Configurar meta de alocação',
      'Ver novo RI de VALE3',
      'Ajustar exposição internacional',
    ]);
  });

  it('buildDashboardEventsFeed combina dividendos com eventos de resultado/RI/watchlist', () => {
    const events = buildDashboardEventsFeed({
      futureDividends: [
        {symbol: 'TAEE11', date: '2026-05-15', value: 102.33},
        {symbol: 'ITUB4', date: '2026-06-01', value: 87.1},
      ],
      watchlistSignals: ['VALE3 em zona de preço relevante'],
      topSymbol: 'VALE3',
    });

    expect(events.length).toBeGreaterThanOrEqual(5);
    expect(events.some((event) => event.tag === 'Dividendo')).toBe(true);
    expect(events.some((event) => event.tag === 'Resultado')).toBe(true);
    expect(events.some((event) => event.tag === 'RI')).toBe(true);
    expect(events.some((event) => event.tag === 'Watchlist')).toBe(true);
  });

  it('buildRiskSnapshot retorna score e nível coerentes', () => {
    const snapshot = buildRiskSnapshot({
      volatilityPct: 2.4,
      concentrationName: 'Ações',
      concentrationValue: 69.28,
      classExposureCount: 2,
      dominantSectorName: 'Financeiro',
      dominantSectorPct: 48,
    });

    expect(snapshot.riskScore).toBeGreaterThan(0);
    expect(snapshot.diversificationScore).toBeGreaterThanOrEqual(0);
    expect(snapshot.riskLevel).toBe('Alta');
    expect(snapshot.dominantClassText).toContain('Ações');
    expect(snapshot.dominantSectorText).toContain('Financeiro');
  });
});
