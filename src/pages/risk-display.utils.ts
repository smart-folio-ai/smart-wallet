import type {PortfolioReturns} from '@/hooks/usePortfolioReturns';
import {
  formatCurrencyWholePtBr,
  formatPctPtBr,
  formatPpPtBr,
  formatSignedPctPtBr,
} from '@/utils/formatters';

/**
 * Tradução do bloco de risco de `/portfolio/returns` para os textos do
 * protótipo App do handoff (`kpisAdv` e barra `quant`), TRA-141.
 *
 * Cada função devolve `null` (ou o texto neutro de antes) quando o servidor
 * não calculou: slot sem número real não ganha número inventado.
 */

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const ptBr2 = (value: number) =>
  value.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});

/** `2025-03-14` → `mar/25`, como a nota do drawdown no handoff. */
export function formatMonthShort(isoDate: string): string | null {
  const match = /^(\d{4})-(\d{2})/.exec(isoDate || '');
  if (!match) return null;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month}/${match[1].slice(2)}` : null;
}

/** Nota do Máx. drawdown: `mar/25 · 38 dias` (mês do fundo, pregões do topo ao fundo). */
export function formatDrawdownNote(
  drawdown: NonNullable<PortfolioReturns['risk']>['drawdown'] | undefined,
): string | null {
  if (!drawdown?.troughDate || drawdown.durationDays == null) return null;
  const month = formatMonthShort(drawdown.troughDate);
  if (!month) return null;
  return `${month} · ${drawdown.durationDays} ${drawdown.durationDays === 1 ? 'dia' : 'dias'}`;
}

/** Nota do Beta: `up 0,88 / down 0,61`. `null` sem os dois lados. */
export function formatBetaNote(
  upBeta: number | null | undefined,
  downBeta: number | null | undefined,
): string | null {
  if (upBeta == null || downBeta == null) return null;
  return `up ${ptBr2(upBeta)} / down ${ptBr2(downBeta)}`;
}

/** Nota do Sharpe: `rf 10,2% a.a.` — a taxa livre de risco usada na conta. */
export function formatSharpeNote(riskFreeAnnual: number | null | undefined): string | null {
  if (riskFreeAnnual == null) return null;
  return `rf ${formatPctPtBr(riskFreeAnnual * 100, 1)} a.a.`;
}

export interface KpiSlot {
  value: string;
  delta: string;
  sub: string;
  /** Cor do delta: resultado positivo em `--pos`, perda em `--neg`. */
  positive: boolean;
}

/** 4º KPI do avançado: `VaR 95% · 21d`, `R$ 41.180`, `3,2%`, `do patrimônio`. */
export function buildVarKpi(risk: PortfolioReturns['risk']): KpiSlot | null {
  const valueAtRisk = risk?.valueAtRisk;
  if (valueAtRisk?.varPct == null || valueAtRisk.amount == null) return null;
  return {
    value: formatCurrencyWholePtBr(valueAtRisk.amount),
    delta: formatPctPtBr(valueAtRisk.varPct * 100, 1),
    sub: 'do patrimônio',
    // VaR é perda potencial: o handoff o pinta como `up: false`.
    positive: false,
  };
}

/** 2º KPI do avançado: `Resultado 12M`, `+28,7%`, `α +14,1 p.p.`, `vs IBOV +14,6%`. */
export function buildResult12mKpi(benchmark: PortfolioReturns['benchmark'] | undefined): KpiSlot | null {
  if (
    benchmark?.portfolioReturn == null ||
    benchmark.alpha == null ||
    benchmark.benchmarkReturn == null
  ) {
    return null;
  }
  return {
    value: formatSignedPctPtBr(benchmark.portfolioReturn * 100),
    delta: `α ${formatPpPtBr(benchmark.alpha * 100)}`,
    sub: `vs IBOV ${formatSignedPctPtBr(benchmark.benchmarkReturn * 100)}`,
    positive: benchmark.alpha >= 0,
  };
}
