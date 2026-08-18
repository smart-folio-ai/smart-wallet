import {aiAnalysisService, AssetOpinionResponse} from '@/services/ai';

export type AssetOpinion = AssetOpinionResponse;

/**
 * Cliente fino de POST /ai/asset-opinion. Toda a composição (score,
 * seleção de drivers, texto) acontece no server (AssetOpinionService) —
 * este arquivo antes reimplementava um benchmark com limiares fixos que
 * emitia COMPRA/HOLD/VENDA e chamava /ai/chat genérico direto; os dois
 * problemas eram a mesma superfície do que o TRA-53 mapeou (TRA-9).
 */
export async function getAssetOpinion(symbol: string): Promise<AssetOpinion> {
  return aiAnalysisService.assetOpinion(symbol);
}
