import {useQuery} from '@tanstack/react-query';
import {portfolioService} from '@/server/api/api';

/**
 * Contribuição de risco por ativo, de `GET /portfolio/risk-contribution`
 * (TRA-141). Espelha `PortfolioRiskContributionOutput` do servidor.
 */

export interface RiskContributionRow {
  symbol: string;
  /** Peso no valor dos ativos medidos, 0-100. */
  weightPct: number;
  /** Fatia da variância da carteira, 0-100. */
  sharePct: number;
}

export interface PortfolioRiskContribution {
  rows: RiskContributionRow[];
  observations: number;
  portfolioVolatility: number | null;
  /** Ativos sem série diária (cripto, histórico curto). */
  missingSymbols: string[];
  /** Parte do valor que ficou fora da conta, 0-100. */
  excludedValuePct: number;
  truncated: boolean;
}

export const PORTFOLIO_RISK_CONTRIBUTION_QUERY_KEY = [
  'portfolio-risk-contribution',
] as const;

export function usePortfolioRiskContribution() {
  return useQuery<PortfolioRiskContribution>({
    queryKey: PORTFOLIO_RISK_CONTRIBUTION_QUERY_KEY,
    queryFn: async () => (await portfolioService.getRiskContribution()).data,
    // Um ano de fechamentos diários: muda uma vez por pregão.
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
