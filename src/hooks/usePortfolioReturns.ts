import {useQuery} from '@tanstack/react-query';
import {portfolioService} from '@/server/api/api';

/**
 * Retornos da carteira vindos de `GET /portfolio/returns` (TRA-147).
 *
 * Espelha `PortfolioReturnsOutput` do servidor. O campo `unavailable` é parte
 * do contrato, não um detalhe: o backend declara o que NÃO conseguiu calcular
 * em vez de devolver estimativa, e a interface precisa dizer isso ao usuário.
 */

export type ReturnsUnavailableReason =
  | 'cash_flows_missing'
  | 'twr_insufficient_series'
  | 'irr_not_solvable'
  | 'benchmark_insufficient_observations'
  | 'benchmark_no_variance'
  | 'benchmark_preferred_index_unavailable'
  | 'sharpe_insufficient_data'
  | 'var_insufficient_windows';

export interface PortfolioReturns {
  from: string | null;
  to: string | null;
  contribution: {
    currentValue: number;
    contributed: number;
    marketGain: number;
    marketGainPct: number | null;
  };
  twr: {
    value: number | null;
    annualized: number | null;
    periods: number;
  };
  irr: number | null;
  /**
   * Sensibilidade e aderência ao IBOV (TRA-141). `beta` só vem preenchido com
   * pelo menos 20 pregões pareados — abaixo disso o número é ruído.
   */
  benchmark: {
    symbol: string;
    /**
     * Nome do índice usado de fato (`IBOV`, `IFIX`). O servidor escolhe pela
     * composição da carteira, então a tela não pode assumir IBOV (TRA-141).
     */
    label?: string;
    beta: number | null;
    trackingError: number | null;
    correlation: number | null;
    observations: number;
    /** Beta nos dias de alta / queda do IBOV. Opcional: servidor anterior a TRA-141 não manda. */
    upBeta?: number | null;
    downBeta?: number | null;
    /** Retornos acumulados nos pregões pareados, em fração. */
    portfolioReturn?: number | null;
    benchmarkReturn?: number | null;
    /** Retorno da carteira − beta × retorno do IBOV, em fração. */
    alpha?: number | null;
  };
  /**
   * Risco do nível avançado do handoff, calculado no servidor sobre retorno
   * ajustado por fluxo (TRA-141). Opcional pelo mesmo motivo.
   */
  risk?: {
    sharpe: {
      sharpe: number | null;
      riskFreeAnnual: number | null;
      observations: number;
    };
    valueAtRisk: {
      varPct: number | null;
      amount: number | null;
      cvarPct: number | null;
      cvarAmount: number | null;
      horizonDays: number;
      confidence: number;
      windows: number;
    };
    drawdown: {
      maxDrawdown: number | null;
      peakDate: string | null;
      troughDate: string | null;
      durationDays: number | null;
      recoveryDate: string | null;
    };
  };
  unavailable: ReturnsUnavailableReason[];
  staleDays: number;
}

/** Texto por motivo, para a tela não precisar conhecer os códigos. */
export const UNAVAILABLE_LABEL: Record<ReturnsUnavailableReason, string> = {
  cash_flows_missing:
    'Importe suas notas de corretagem para separarmos aporte de rendimento.',
  twr_insufficient_series:
    'Ainda não há dias suficientes de histórico para calcular a rentabilidade.',
  irr_not_solvable:
    'Não foi possível calcular o retorno do seu capital com os aportes registrados.',
  benchmark_insufficient_observations:
    'Beta e tracking error precisam de pelo menos 20 pregões de histórico.',
  benchmark_no_variance:
    'O índice de referência não variou no período — não há como medir sensibilidade a ele.',
  benchmark_preferred_index_unavailable:
    'O índice mais adequado à sua carteira está indisponível; a comparação usa o IBOV.',
  sharpe_insufficient_data:
    'O Sharpe precisa de pelo menos 20 pregões com CDI disponível.',
  var_insufficient_windows:
    'O VaR de 21 dias precisa de cerca de dois meses de histórico diário.',
};

export const PORTFOLIO_RETURNS_QUERY_KEY = ['portfolio-returns'] as const;

export function usePortfolioReturns(range?: {from?: string; to?: string}) {
  return useQuery<PortfolioReturns>({
    queryKey: [...PORTFOLIO_RETURNS_QUERY_KEY, range?.from, range?.to],
    queryFn: async () => (await portfolioService.getReturns(range)).data,
    // A série só muda uma vez por dia, no snapshot das 19:30.
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}
