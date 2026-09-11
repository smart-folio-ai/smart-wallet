import type {AdaptiveLevel} from '@/contexts/adaptive-level.mapping';
import {
  formatPpPtBr,
  formatSignedPctPtBr,
} from '@/utils/formatters';

/**
 * Vocabulário do Copiloto por nível, copiado do protótipo App do handoff
 * (`prompts` e `copilotMode` da tela Copiloto). As telas só consomem.
 */

export const COPILOT_PROMPTS: Record<AdaptiveLevel, string[]> = {
  iniciante: [
    'O que é diversificação?',
    'Quanto eu já recebi de proventos?',
    'Preciso fazer algo hoje?',
    'Explique meu resultado',
  ],
  intermediario: [
    'Comparar com o IBOV',
    'Quanto vou pagar de imposto?',
    'Simular aporte de R$ 20k',
    'Onde estou fora do alvo?',
  ],
  avancado: [
    'Decompor o VaR por fator',
    'Matriz de correlação',
    'Otimizar carry fiscal até dez',
    'Atribuição de retorno 12M',
  ],
};

export const copilotModeLabel = (level: AdaptiveLevel): string =>
  'Respondendo em modo ' +
  (level === 'iniciante'
    ? 'Iniciante · linguagem simples, sem jargão'
    : level === 'intermediario'
      ? 'Intermediário · benchmarks e impacto fiscal'
      : 'Avançado · métricas quantitativas e auditoria');

/** Tile de métrica da bolha do Copiloto no handoff (grade de 3). */
export interface CopilotMetric {
  label: string;
  value: string;
}

const correlation2 = (value: number) =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Tiles das análises determinísticas do Copiloto (TRA-141). O servidor manda
 * frações; aqui viram o formato do handoff (`+28,7%`, `+14,1 p.p.`, `0,86`).
 *
 * Lista vazia quando a resposta não é uma dessas análises ou não tem dado —
 * tile com "N/D" seria ruído com cara de número.
 */
export function buildCopilotMetrics(
  data: Record<string, unknown> | undefined,
): CopilotMetric[] {
  const matrix = (data as any)?.correlationMatrix;
  if (matrix && typeof matrix.averageCorrelation === 'number') {
    const metrics: CopilotMetric[] = [
      {label: 'Correlação média', value: correlation2(matrix.averageCorrelation)},
    ];
    const high = matrix.highestPair;
    if (high && typeof high.correlation === 'number') {
      metrics.push({
        label: `${high.a} × ${high.b}`,
        value: correlation2(high.correlation),
      });
    }
    const low = matrix.lowestPair;
    if (low && typeof low.correlation === 'number') {
      metrics.push({
        label: `${low.a} × ${low.b}`,
        value: correlation2(low.correlation),
      });
    }
    return metrics;
  }

  const attribution = (data as any)?.returnAttribution;
  if (attribution && typeof attribution.totalReturn === 'number') {
    const metrics: CopilotMetric[] = [
      {
        label: 'Retorno 12M',
        value: formatSignedPctPtBr(attribution.totalReturn * 100),
      },
    ];
    const top = attribution.topContributor;
    if (top && typeof top.contribution === 'number') {
      metrics.push({
        label: `Maior contribuição · ${top.symbol}`,
        value: formatPpPtBr(top.contribution * 100),
      });
    }
    const detractor = attribution.topDetractor;
    if (detractor && typeof detractor.contribution === 'number') {
      metrics.push({
        label: `Maior detrator · ${detractor.symbol}`,
        value: formatPpPtBr(detractor.contribution * 100),
      });
    }
    return metrics;
  }

  return [];
}
