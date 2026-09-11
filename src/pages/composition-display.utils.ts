import type {
  AllocationBucket,
  BucketGap,
} from '@/hooks/usePortfolioComposition';
import {formatCurrencyWholePtBr, formatPpPtBr} from '@/utils/formatters';

/**
 * Tradução entre o contrato de `/portfolio/composition` e o vocabulário do
 * handoff (TRA-141).
 *
 * ## Por que existe
 *
 * O servidor devolve `gapPct = alvo − atual` (positivo = falta comprar), que é
 * a leitura natural para quem calcula quanto mover. O handoff fala em
 * "desvio" no sentido inverso: `+6,2 p.p. em Ações` em `--warn` significa
 * ações ACIMA da meta (card Alocação e card Exposição do protótipo App).
 *
 * Inverter o sinal em cada tela seria pedir para uma delas esquecer. A
 * conversão mora aqui, num lugar só, e as telas só consomem.
 */

export const BUCKET_LABEL: Record<AllocationBucket, string> = {
  stocks: 'Ações',
  crypto: 'Cripto',
  fiis: 'FIIs',
  other: 'Outros',
};

/** Abaixo disto o balde está na meta — ruído de arredondamento, não desvio. */
export const ALIGNED_TOLERANCE_PP = 0.05;

/** Limiar do handoff para destacar o desvio em `--warn`. */
export const MATERIAL_DEVIATION_PP = 5;

/** Convenção do handoff: atual − alvo. Positivo = acima da meta. */
export const toDeviation = (gapPct: number): number => -gapPct;

export interface LargestGapLine {
  /** Trecho destacado em `--warn`: `+6,2 p.p. em Ações`. */
  highlight: string;
  /** `R$ 48.900` — quanto rebalancear, sempre em módulo. */
  amount: string;
}

/**
 * Linha "Desvio do alvo" do card Alocação do handoff.
 *
 * `null` quando não há meta ou quando tudo está dentro da tolerância: o
 * protótipo não mostra a linha para uma carteira alinhada, e mostrar
 * "+0,0 p.p." seria ruído com cara de alerta.
 */
export function describeLargestGap(
  gap: BucketGap | null | undefined,
): LargestGapLine | null {
  if (!gap) return null;
  const deviation = toDeviation(gap.gapPct);
  if (Math.abs(deviation) < ALIGNED_TOLERANCE_PP) return null;

  return {
    highlight: `${formatPpPtBr(deviation)} em ${BUCKET_LABEL[gap.bucket]}`,
    amount: formatCurrencyWholePtBr(Math.abs(gap.amount)),
  };
}

export interface ExposureRow {
  bucket: AllocationBucket;
  label: string;
  /** Reais no balde hoje. */
  value: number;
  /** Peso atual, 0-100. */
  pct: number;
  /** Alvo da política, 0-100. */
  target: number;
  /** Atual − alvo, em p.p. (convenção do handoff). */
  dev: number;
}

/**
 * Linhas do card "Exposição por classe · Real vs alvo" a partir dos baldes da
 * política. Ordena por peso, como o card fazia antes.
 */
export function buildExposureRowsFromBuckets(
  buckets: BucketGap[],
  totalValue: number,
): ExposureRow[] {
  return (buckets || [])
    .map((bucket) => ({
      bucket: bucket.bucket,
      label: BUCKET_LABEL[bucket.bucket],
      value: (bucket.currentPct / 100) * totalValue,
      pct: bucket.currentPct,
      target: bucket.targetPct,
      dev: toDeviation(bucket.gapPct),
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Cor do desvio. `--warn` é, no handoff, o token de "desvio de política";
 * `--neg` é reservado a resultado negativo e ação destrutiva, "sempre com
 * ícone" — estar abaixo da meta não é nenhum dos dois.
 */
export const deviationColor = (dev: number): string =>
  Math.abs(dev) > MATERIAL_DEVIATION_PP ? 'var(--warn)' : 'var(--pos)';
