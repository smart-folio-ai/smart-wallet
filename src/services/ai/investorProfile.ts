import {aiService} from '@/server/api/api';

export type SophisticationLevel = 'beginner' | 'intermediate' | 'experienced';
export type RiskToleranceLevel = 'conservative' | 'moderate' | 'aggressive';

export interface InvestorProfileResponse {
  sophistication: SophisticationLevel;
  riskTolerance: RiskToleranceLevel;
  confidence: number;
  signals: Record<string, number | boolean>;
  source: 'inferred' | 'user_override';
}

/**
 * Cliente fino de GET/PUT /ai/investor-profile. Todo o calculo de
 * sofisticacao/tolerancia a risco acontece no server (InvestorProfileService,
 * spec 2026-08-27-ai-insights-adaptive-profile-redesign-design.md) —
 * deterministico, sem LLM.
 */
export async function getInvestorProfile(): Promise<InvestorProfileResponse> {
  const response = await aiService.getInvestorProfile();
  return response.data;
}

/**
 * `null` explicito em um campo limpa o override e volta ao valor inferido
 * pelo server; `undefined`/campo omitido deixa o valor atual inalterado.
 */
export async function setInvestorProfileOverride(
  override: {
    sophistication?: SophisticationLevel | null;
    riskTolerance?: RiskToleranceLevel | null;
  },
): Promise<InvestorProfileResponse> {
  const response = await aiService.updateInvestorProfile(override);
  return response.data;
}
