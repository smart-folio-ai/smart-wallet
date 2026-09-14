import type {InvestorProfileResponse} from '@/services/ai/investorProfile';
import type {PortfolioScoreResponse} from '@/services/ai';

export interface SignalRow {
  label: string;
  /** 0 a 1; `null` deixa a barra vazia em vez de inventar um valor. */
  ratio: number | null;
  value: string;
}

const formatScore = (score: number) =>
  Number.isInteger(score) ? String(score) : score.toFixed(1);

/**
 * Só entram razões que existem de verdade: score determinístico (0–100) e a
 * confiança da inferência do perfil (0–1). Os sinais de uso do perfil são
 * contagens sem escala e por isso só aparecem no total do subtítulo.
 */
export function buildSignalRows(
  score: PortfolioScoreResponse | null,
  profile: InvestorProfileResponse | null,
): SignalRow[] {
  const overall = score?.status === 'ok' ? score.overall : null;
  const dimension = (key: 'diversification' | 'risk') =>
    score?.dimensions.find((item) => item.key === key)?.score ?? null;
  const fromScore = (label: string, value: number | null): SignalRow => ({
    label,
    ratio: value === null ? null : value / 100,
    value: value === null ? '—' : formatScore(value),
  });

  return [
    fromScore('Score da carteira', overall),
    fromScore('Diversificação', dimension('diversification')),
    // A dimensão de risco vem invertida (100 = risco sob controle): rotular
    // só "Risco" faria uma barra cheia ler como o oposto do que é.
    fromScore('Controle de risco', dimension('risk')),
    {
      label: 'Confiança do perfil',
      ratio: profile ? profile.confidence : null,
      value: profile ? `${Math.round(profile.confidence * 100)}%` : '—',
    },
  ];
}
