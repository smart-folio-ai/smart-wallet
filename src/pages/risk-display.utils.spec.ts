import {describe, it, expect} from 'vitest';
import {
  benchmarkLabel,
  buildResult12mKpi,
  buildVarKpi,
  formatBetaNote,
  formatDrawdownNote,
  formatMonthShort,
  formatSharpeNote,
} from './risk-display.utils';

describe('notas da barra quant do handoff', () => {
  it('formata o mês curto', () => {
    expect(formatMonthShort('2025-03-14')).toBe('mar/25');
    expect(formatMonthShort('lixo')).toBeNull();
  });

  it('reproduz "mar/25 · 38 dias" do drawdown', () => {
    expect(
      formatDrawdownNote({
        maxDrawdown: -0.142,
        peakDate: '2025-01-20',
        troughDate: '2025-03-14',
        durationDays: 38,
        recoveryDate: null,
      }),
    ).toBe('mar/25 · 38 dias');
  });

  it('não gera nota de drawdown sem fundo', () => {
    expect(
      formatDrawdownNote({
        maxDrawdown: 0,
        peakDate: null,
        troughDate: null,
        durationDays: null,
        recoveryDate: null,
      }),
    ).toBeNull();
  });

  it('reproduz "up 0,88 / down 0,61" do beta', () => {
    expect(formatBetaNote(0.88, 0.61)).toBe('up 0,88 / down 0,61');
    expect(formatBetaNote(0.88, null)).toBeNull();
  });

  it('reproduz "rf 10,2% a.a." do Sharpe', () => {
    expect(formatSharpeNote(0.102)).toBe('rf 10,2% a.a.');
    expect(formatSharpeNote(null)).toBeNull();
  });
});

describe('benchmarkLabel', () => {
  // O servidor troca o índice conforme a carteira; a tela não pode assumir.
  it('usa o índice declarado pelo servidor', () => {
    expect(benchmarkLabel({symbol: '^IFIX', label: 'IFIX'} as never)).toBe('IFIX');
  });

  it('cai para IBOV quando o servidor não declara', () => {
    expect(benchmarkLabel(undefined)).toBe('IBOV');
    expect(benchmarkLabel({symbol: '^BVSP'} as never)).toBe('IBOV');
  });
});

describe('KPIs do avançado', () => {
  it('monta o card VaR 95% · 21d', () => {
    const kpi = buildVarKpi({
      sharpe: {sharpe: 1.42, riskFreeAnnual: 0.102, observations: 240},
      valueAtRisk: {
        varPct: 0.032,
        amount: 41180,
        cvarPct: 0.045,
        cvarAmount: 57900,
        horizonDays: 21,
        confidence: 0.95,
        windows: 220,
      },
      drawdown: {
        maxDrawdown: -0.142,
        peakDate: null,
        troughDate: null,
        durationDays: null,
        recoveryDate: null,
      },
    });

    expect(kpi?.value).toMatch(/^R\$\s?41\.180$/);
    expect(kpi?.delta).toBe('3,2%');
    expect(kpi?.sub).toBe('do patrimônio');
    expect(kpi?.positive).toBe(false);
  });

  it('não monta VaR sem cálculo', () => {
    expect(buildVarKpi(undefined)).toBeNull();
  });

  it('monta o card Resultado 12M com alpha', () => {
    const kpi = buildResult12mKpi({
      symbol: '^BVSP',
      beta: 0.86,
      trackingError: 0.064,
      correlation: 0.8,
      observations: 240,
      portfolioReturn: 0.287,
      benchmarkReturn: 0.146,
      alpha: 0.141,
    });

    expect(kpi).toEqual({
      value: '+28,7%',
      delta: 'α +14,1 p.p.',
      sub: 'vs IBOV +14,6%',
      positive: true,
    });
  });

  it('nomeia o índice de fato usado no subtexto', () => {
    const kpi = buildResult12mKpi({
      symbol: '^IFIX',
      label: 'IFIX',
      beta: 0.7,
      trackingError: 0.03,
      correlation: 0.9,
      observations: 240,
      portfolioReturn: 0.12,
      benchmarkReturn: 0.1,
      alpha: 0.05,
    });

    expect(kpi?.sub).toBe('vs IFIX +10,0%');
  });

  it('não monta Resultado 12M sem alpha', () => {
    expect(
      buildResult12mKpi({
        symbol: '^BVSP',
        beta: null,
        trackingError: null,
        correlation: null,
        observations: 8,
      }),
    ).toBeNull();
  });
});
