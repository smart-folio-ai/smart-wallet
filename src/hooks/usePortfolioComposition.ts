import {useQuery} from '@tanstack/react-query';
import {portfolioService} from '@/server/api/api';

/**
 * Composição da carteira vinda de `GET /portfolio/composition` (TRA-141).
 *
 * Espelha `PortfolioCompositionOutput` do servidor. `rebalancing.gapPct` segue
 * a convenção do SERVIDOR (alvo − atual; positivo = falta comprar). A tela usa
 * a convenção do handoff (atual − alvo; positivo = acima da meta) — a
 * conversão fica em `composition-display.utils.ts`, num lugar só.
 */

export type AllocationBucket = 'stocks' | 'crypto' | 'fiis' | 'other';

export interface BucketGap {
  bucket: AllocationBucket;
  currentPct: number;
  targetPct: number;
  /** Convenção do servidor: alvo − atual. */
  gapPct: number;
  /** Reais a mover. Positivo = comprar. */
  amount: number;
}

export interface PortfolioComposition {
  yield: {
    assets: {
      symbol: string;
      dividendsPerShare: number;
      yieldOnCost: number | null;
      yieldOnMarket: number | null;
    }[];
    portfolioYieldOnCost: number | null;
    portfolioYieldOnMarket: number | null;
    estimatedAnnualIncome: number;
    /** true quando há posição mais nova que a janela de 12 meses. */
    approximated: boolean;
  };
  rebalancing: {
    buckets: BucketGap[];
    totalDriftPct: number;
    largestGap: BucketGap | null;
    hasTarget: boolean;
    totalValue: number;
  };
  unavailable: string[];
}

export const PORTFOLIO_COMPOSITION_QUERY_KEY = ['portfolio-composition'] as const;

export function usePortfolioComposition() {
  return useQuery<PortfolioComposition>({
    queryKey: PORTFOLIO_COMPOSITION_QUERY_KEY,
    queryFn: async () => (await portfolioService.getComposition()).data,
    // Retrato da carteira: muda com cotação e com a meta, não a cada foco.
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
