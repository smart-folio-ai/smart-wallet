import type {
  PortfolioRiskContribution,
  RiskContributionRow,
} from '@/hooks/usePortfolioRiskContribution';
import {formatPctPtBr} from '@/utils/formatters';

/**
 * Card "Contribuição de risco por ativo" da tela Portfólio do handoff
 * (`riskRows`, `riskFooter`), TRA-141.
 *
 * O card antes calculava a "fatia do VaR" no navegador com multiplicadores
 * fixos por classe — número inventado com cara de medida. Agora consome a
 * decomposição de Euler do servidor e, sem ela, o card não aparece.
 */

/** Cinco nomes e "Demais N", como `RISK_ROWS` do protótipo. */
export const RISK_ROWS_SHOWN = 5;

/** Acima disto a barra fica em `--warn`, como no protótipo (`share > 15`). */
export const RISK_SHARE_WARN_PCT = 15;

export interface RiskRowView {
  symbol: string;
  sharePct: number;
  weightPct: number;
  share: string;
  weight: string;
  warn: boolean;
}

const toView = (row: RiskContributionRow): RiskRowView => ({
  ...row,
  share: formatPctPtBr(row.sharePct, 1),
  weight: formatPctPtBr(row.weightPct, 1),
  warn: row.sharePct > RISK_SHARE_WARN_PCT,
});

export function buildRiskRows(
  result: PortfolioRiskContribution | undefined,
): RiskRowView[] {
  const rows = result?.rows ?? [];
  if (rows.length <= RISK_ROWS_SHOWN + 1) return rows.map(toView);

  const head = rows.slice(0, RISK_ROWS_SHOWN);
  const rest = rows.slice(RISK_ROWS_SHOWN);
  const others: RiskContributionRow = {
    symbol: `Demais ${rest.length}`,
    sharePct: rest.reduce((sum, row) => sum + row.sharePct, 0),
    weightPct: rest.reduce((sum, row) => sum + row.weightPct, 0),
  };
  return [...head.map(toView), toView(others)];
}

/** Largura da barra: o protótipo usa `share × 3,4`, limitado ao trilho. */
export const riskBarWidthPct = (sharePct: number): number =>
  Math.max(0, Math.min(sharePct * 3.4, 100));

/**
 * Rodapé do card, no tom do protótipo: compara a concentração de risco dos
 * dois maiores com a de valor.
 */
export function describeRiskFooter(
  rows: RiskRowView[],
  advanced: boolean,
): string | null {
  const named = rows.filter((row) => !row.symbol.startsWith('Demais'));
  if (named.length < 2) return null;
  const [first, second] = named;
  const shareSum = first.sharePct + second.sharePct;
  const weightSum = first.weightPct + second.weightPct;
  const share = formatPctPtBr(shareSum, 1);
  const weight = formatPctPtBr(weightSum, 1);

  if (advanced) {
    const ratio = weightSum > 0 ? shareSum / weightSum : 1;
    const comparison =
      ratio >= 2
        ? 'mais que o dobro da'
        : ratio >= 1.7
          ? 'quase o dobro da'
          : ratio > 1.1
            ? 'maior que a'
            : ratio < 0.9
              ? 'menor que a'
              : 'próxima da';
    return `Dois nomes (${first.symbol} e ${second.symbol}) respondem por ${share} do VaR com ${weight} de peso. A concentração de risco é ${comparison} concentração de valor.`;
  }
  return `${first.symbol} e ${second.symbol} juntos movem ${share} da sua carteira, somando ${weight} do valor investido.`;
}

/** O que ficou fora da conta, dito na tela em vez de escondido. */
export function describeExcluded(
  result: PortfolioRiskContribution | undefined,
): string | null {
  if (!result || result.excludedValuePct < 0.05) return null;
  const names = result.missingSymbols.slice(0, 3).join(', ');
  const more =
    result.missingSymbols.length > 3
      ? ` e mais ${result.missingSymbols.length - 3}`
      : '';
  return `Fora da conta: ${formatPctPtBr(result.excludedValuePct, 1)} do valor${
    names ? ` (${names}${more})` : ''
  }, sem série diária de preço.`;
}
