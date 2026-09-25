import {useQuery} from '@tanstack/react-query';
import {
  aiAnalysisService,
  type AiAnalysisResult,
  type OpportunityRadarResponse,
  type PortfolioErrorRadarResponse,
  type PortfolioScoreResponse,
} from '@/services/ai';
import {portfolioService} from '@/server/api/api';
import {getAiPlanFromPlanName, getOrCreateAiAnalysis} from '@/services/ai/trakkerAi';

type AiPlan = ReturnType<typeof getAiPlanFromPlanName>;

export interface AiInsightsData {
  analysis: AiAnalysisResult;
  score: PortfolioScoreResponse | null;
  radar: PortfolioErrorRadarResponse | null;
  /**
   * Distingue "o radar falhou" de "não há radar": `radar === null` cobre os
   * dois casos e não serve sozinho para decidir se mostra o estado de falha.
   */
  radarFailed: boolean;
  /** Radar de Oportunidades (TRA-8/14) — endpoint dedicado, best-effort. */
  opportunityRadar: OpportunityRadarResponse | null;
}

function extractAssets(rawData: unknown): unknown[] {
  // A API devolve o array direto OU embrulhado em { assets: [...] }.
  if (Array.isArray(rawData)) return rawData;
  const wrapped = (rawData as {assets?: unknown} | null)?.assets;
  return Array.isArray(wrapped) ? wrapped : [];
}

async function fetchAiInsights(plan: AiPlan): Promise<AiInsightsData> {
  const portfolioResponse = await portfolioService.getAssets();
  const assets = extractAssets(portfolioResponse.data);

  // Score e radares vêm do backend determinístico e independem da análise
  // do LLM: se o trackerr-ia cair, eles continuam aparecendo, e vice-versa.
  const [analysisOutcome, scoreOutcome, radarOutcome, opportunityOutcome] =
    await Promise.allSettled([
      getOrCreateAiAnalysis({rawAssets: assets, plan}),
      aiAnalysisService.portfolioScore(),
      aiAnalysisService.errorRadar(),
      aiAnalysisService.opportunityRadar(),
    ]);

  if (analysisOutcome.status === 'rejected') throw analysisOutcome.reason;

  return {
    analysis: analysisOutcome.value,
    score: scoreOutcome.status === 'fulfilled' ? scoreOutcome.value : null,
    radar: radarOutcome.status === 'fulfilled' ? radarOutcome.value : null,
    radarFailed: radarOutcome.status === 'rejected',
    opportunityRadar:
      opportunityOutcome.status === 'fulfilled' ? opportunityOutcome.value : null,
  };
}

export function useAiInsightsData(params: {plan: AiPlan; enabled: boolean}) {
  return useQuery({
    queryKey: ['ai-insights', params.plan],
    queryFn: () => fetchAiInsights(params.plan),
    enabled: params.enabled,
    // Cada execução pode chamar o LLM: nada de refazer por foco de janela nem
    // repetir automaticamente uma falha — o usuário tem o botão de atualizar.
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
