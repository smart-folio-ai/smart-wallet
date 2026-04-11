import {describe, expect, it} from 'vitest';
import {
  buildInsightsV2,
  buildPortfolioInsightSnapshot,
  buildScanExpandedPayloads,
} from './insights-v2';

const baseAnalysis = {
  portfolio_assessment: 'Carteira focada em crescimento com risco moderado.',
  investment_score: {
    overall: 62,
    diversification: 48,
    risk: 55,
    consistency: 74,
    volatility: 52,
    details: {
      score: 62,
      strengths: [],
      weaknesses: [],
      recommendations: [],
    },
  },
  error_detection: [],
  opportunity_radar: [
    {
      symbol: 'VALE3',
      type: 'value',
      price: 60,
      target_price: 70,
      upside: 16,
      rationale: 'Valuation descontuado contra histórico de geração de caixa.',
    },
  ],
  risk_assessment: 'Moderado',
  rebalancing: {
    ideal_allocation: [
      {category: 'Ações', current: 72, ideal: 55},
      {category: 'FIIs', current: 8, ideal: 20},
    ],
    top_moves: ['Reduzir ações e ampliar FIIs.'],
  },
} as any;

const baseAssets = [
  {symbol: 'VALE3', type: 'stock', quantity: 100, current_price: 60, sector: 'Mineração'},
  {symbol: 'PETR4', type: 'stock', quantity: 120, current_price: 30, sector: 'Energia'},
  {symbol: 'MXRF11', type: 'fii', quantity: 300, current_price: 10, sector: 'Imobiliário'},
];

describe('insights-v2', () => {
  it('builds actionable score explanation with positive/negative drivers and next action', () => {
    const output = buildInsightsV2({
      assets: baseAssets,
      analysis: baseAnalysis,
    });

    const scoreCard = output.cards.find((card) => card.type === 'investment_score_explanation');
    expect(scoreCard).toBeDefined();
    expect(scoreCard?.deterministicFacts.join(' ')).toContain('Score atual: 62');
    expect(scoreCard?.deterministicFacts.join(' ')).toContain('Maior força');
    expect(scoreCard?.deterministicFacts.join(' ')).toContain('Maior fragilidade');
    expect(scoreCard?.deterministicFacts.join(' ')).toContain('Próxima melhor ação');
  });

  it('selects concentration as top priority when dominant asset concentration is high', () => {
    const concentratedAssets = [
      {symbol: 'VALE3', type: 'stock', quantity: 500, current_price: 60},
      {symbol: 'ITUB4', type: 'stock', quantity: 20, current_price: 30},
    ];

    const output = buildInsightsV2({
      assets: concentratedAssets,
      analysis: baseAnalysis,
    });

    expect(output.topPriority.type).toBe('priority_of_day');
    expect(output.topPriority.title).toContain('reduzir concentração');
    expect(output.topPriority.severity).toMatch(/high|critical/);
  });

  it('builds action and inaction consequence cards grounded in top priority', () => {
    const output = buildInsightsV2({
      assets: baseAssets,
      analysis: baseAnalysis,
    });

    const actionCard = output.cards.find((card) => card.type === 'if_you_act_today');
    const inactionCard = output.cards.find((card) => card.type === 'cost_of_inaction');

    expect(actionCard?.consequenceIfAction).toBeTruthy();
    expect(inactionCard?.consequenceIfInaction).toBeTruthy();
  });

  it('assembles opportunity reasoning with caution text', () => {
    const output = buildInsightsV2({
      assets: baseAssets,
      analysis: baseAnalysis,
    });

    const opportunityCard = output.cards.find((card) => card.type === 'opportunity_radar');
    expect(opportunityCard?.deterministicFacts.some((line) => line.includes('Cautela:'))).toBe(true);
  });

  it('prioritizes hidden risks and caps list to top 3', () => {
    const riskyAssets = [
      {symbol: 'AAPL34', type: 'stock', quantity: 10, current_price: 10},
      {symbol: 'VALE3', type: 'stock', quantity: 1000, current_price: 60},
    ];
    const output = buildInsightsV2({
      assets: riskyAssets,
      analysis: baseAnalysis,
    });

    const hiddenCard = output.cards.find((card) => card.type === 'hidden_risks');
    expect(hiddenCard).toBeDefined();
    expect(hiddenCard?.deterministicFacts.length).toBeLessThanOrEqual(3);
    expect(hiddenCard?.deterministicFacts.length).toBeGreaterThan(0);
  });

  it('returns unavailable evolution state when no previous snapshot exists', () => {
    const output = buildInsightsV2({
      assets: baseAssets,
      analysis: baseAnalysis,
      previousSnapshot: null,
    });

    const evolution = output.cards.find((card) => card.type === 'portfolio_evolution');
    expect(evolution?.unavailableReason).toBe('no_history_snapshot_available');
  });

  it('compares evolution against previous snapshot when available', () => {
    const previous = buildPortfolioInsightSnapshot({
      diversificationScore: 40,
      riskScore: 49,
      topAssetConcentrationPct: 35,
      internationalExposurePct: 4,
      incomePredictabilityScore: 20,
      now: new Date('2026-04-01T00:00:00.000Z'),
    });

    const output = buildInsightsV2({
      assets: baseAssets,
      analysis: baseAnalysis,
      previousSnapshot: previous,
      now: new Date('2026-04-10T00:00:00.000Z'),
    });

    const evolution = output.cards.find((card) => card.type === 'portfolio_evolution');
    expect(evolution?.unavailableReason).toBeNull();
    expect(evolution?.deterministicFacts.length).toBeGreaterThan(0);
  });

  it('degrades tax readiness safely when fiscal signals are missing', () => {
    const output = buildInsightsV2({
      assets: baseAssets,
      analysis: baseAnalysis,
      fiscalOptimizer: null,
      fiscalSummary: null,
    });

    const tax = output.cards.find((card) => card.type === 'tax_readiness');
    expect(tax?.unavailableReason).toBe('tax_signals_unavailable');
    expect(output.warnings).toContain('fiscal_signals_unavailable');
  });

  it('builds expanded payloads for strategic cards with deterministic fields and CTA mapping', () => {
    const output = buildInsightsV2({
      assets: baseAssets,
      analysis: baseAnalysis,
    });

    expect(output.expandedById['investment-score-explanation']).toBeDefined();
    expect(output.expandedById['auto-rebalance']).toBeDefined();
    expect(output.expandedById['tax-readiness']).toBeDefined();

    const scoreExpanded = output.expandedById['investment-score-explanation'];
    expect(scoreExpanded.deterministicFacts.length).toBeGreaterThan(0);
    expect(scoreExpanded.suggestedActions[0]?.route).toBe('/portfolio');
  });

  it('builds scan expanded payloads and degrades top opportunity when unavailable', () => {
    const output = buildInsightsV2({
      assets: baseAssets,
      analysis: {
        ...baseAnalysis,
        opportunity_radar: [],
      },
    });

    const scanExpanded = buildScanExpandedPayloads({
      assets: baseAssets,
      analysis: {
        ...baseAnalysis,
        opportunity_radar: [],
      } as any,
      insights: output,
    });

    expect(scanExpanded.scan_score_status).toBeDefined();
    expect(scanExpanded.scan_top_opportunity.degradedState).toBe(true);
    expect(scanExpanded.scan_top_opportunity.unavailableReason).toBe(
      'top_opportunity_unavailable',
    );
  });
});
