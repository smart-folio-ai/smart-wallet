/**
 * Projeção determinística do plano: juros compostos mensais sobre o retorno
 * REAL (acima da inflação), então os valores estão em reais de hoje.
 * Cenários conservador/otimista = retorno esperado ∓ 2,4 p.p., como a
 * distância entre as curvas do protótipo (4,0% / 6,4% / 8,8%).
 */
export const SCENARIO_SPREAD_PP = 2.4;
/** Taxa de retirada segura usada para converter patrimônio em renda. */
export const SAFE_WITHDRAWAL_RATE = 0.04;

const monthlyRate = (annualPct: number) => Math.pow(1 + annualPct / 100, 1 / 12) - 1;

/** Valor ao fim de cada ano, do ano 0 (hoje) ao `years`. */
export function projectYearly(initial: number, monthlyContribution: number, annualPct: number, years: number): number[] {
  const rate = monthlyRate(annualPct);
  const values = [initial];
  let value = initial;
  for (let month = 1; month <= years * 12; month++) {
    value = value * (1 + rate) + monthlyContribution;
    if (month % 12 === 0) values.push(value);
  }
  return values;
}

/** Meses até `target`, ou `null` se não chega em 100 anos. */
export function monthsToTarget(initial: number, monthlyContribution: number, annualPct: number, target: number): number | null {
  if (initial >= target) return 0;
  const rate = monthlyRate(annualPct);
  let value = initial;
  for (let month = 1; month <= 1200; month++) {
    value = value * (1 + rate) + monthlyContribution;
    if (value >= target) return month;
  }
  return null;
}

export interface Scenarios {
  conservative: number[];
  expected: number[];
  optimistic: number[];
}

export function buildScenarios(initial: number, monthlyContribution: number, annualPct: number, years: number): Scenarios {
  return {
    conservative: projectYearly(initial, monthlyContribution, annualPct - SCENARIO_SPREAD_PP, years),
    expected: projectYearly(initial, monthlyContribution, annualPct, years),
    optimistic: projectYearly(initial, monthlyContribution, annualPct + SCENARIO_SPREAD_PP, years),
  };
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function addMonthsLabel(months: number, from = new Date(), withMonth = false): string {
  const date = new Date(from.getFullYear(), from.getMonth() + months, 1);
  return withMonth ? `${MONTHS[date.getMonth()]}/${date.getFullYear()}` : String(date.getFullYear());
}

/** "2 anos e 7 meses" / "5 meses". */
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = years ? `${years} ${years === 1 ? 'ano' : 'anos'}` : '';
  const m = rest ? `${rest} ${rest === 1 ? 'mês' : 'meses'}` : '';
  return [y, m].filter(Boolean).join(' e ') || 'menos de 1 mês';
}
