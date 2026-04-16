import {
  aiAnalysisService,
  AiChatResponse,
  AiIntelligentChatResponse,
} from '@/services/ai';

export type ChatRouteType = 'deterministic_no_llm' | 'synthesis_required';

export interface StructuredChatResponse {
  intent: string;
  deterministic: boolean;
  route?: {
    type: ChatRouteType;
    llmEligible: boolean;
    reason: string;
  };
  message: string;
  data?: Record<string, unknown>;
  unavailable?: string[];
  warnings?: string[];
  assumptions?: string[];
}

export interface StructuredChatRequest {
  question: string;
  investorProfile?: 'renda' | 'crescimento' | 'conservador' | 'agressivo';
  copilotFlow?:
    | 'sell_asset'
    | 'rebalance_portfolio'
    | 'reduce_risk_20'
    | 'committee_mode';
  decisionFlow?: {
    action: 'sell' | 'rebalance' | 'reduce_risk';
    ticker?: string;
    quantity?: number;
    sellPrice?: number;
    targetRiskReductionPct?: number;
  };
}

function looksStructured(value: unknown): value is StructuredChatResponse {
  if (!value || typeof value !== 'object') return false;
  const intent = (value as any).intent;
  return typeof intent === 'string';
}

function parsePotentialJson(answer: string): unknown {
  const trimmed = String(answer || '').trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

export function normalizeChatResponse(raw: AiChatResponse | any): StructuredChatResponse {
  if (looksStructured(raw)) {
    const maybeIntelligent = raw as AiIntelligentChatResponse;
    const hasIntelligentFields =
      Object.prototype.hasOwnProperty.call(raw, 'portfolioFacts') ||
      Object.prototype.hasOwnProperty.call(raw, 'externalData') ||
      Object.prototype.hasOwnProperty.call(raw, 'estimates');
    return {
      ...raw,
      message: String((raw as any).message || ''),
      data:
        (raw as any).data ||
        (hasIntelligentFields
          ? {
              portfolioFacts: maybeIntelligent.portfolioFacts || null,
              externalData: maybeIntelligent.externalData || null,
              estimates: maybeIntelligent.estimates || null,
            }
          : {}),
    };
  }

  const answer = String(raw?.answer || raw?.message || '');
  const parsed = parsePotentialJson(answer);
  if (looksStructured(parsed)) {
    return {
      ...parsed,
      message: String((parsed as any).message || ''),
    };
  }

  return {
    intent: 'unknown',
    deterministic: false,
    route: {
      type: 'synthesis_required',
      llmEligible: true,
      reason: 'legacy_plain_text_response',
    },
    message: answer || 'Sem resposta disponível no momento.',
    data: {},
    unavailable: [],
    warnings: [],
    assumptions: [],
  };
}

export async function askStructuredChat(
  payload: string | StructuredChatRequest,
): Promise<StructuredChatResponse> {
  const normalizedPayload =
    typeof payload === 'string' ? {question: payload} : payload;
  const response = await aiAnalysisService.intelligentChat(normalizedPayload);
  return normalizeChatResponse(response);
}

export async function askStructuredCopilotChat(input: {
  question: string;
  investorProfile?: 'renda' | 'crescimento' | 'conservador' | 'agressivo';
  copilotFlow?:
    | 'sell_asset'
    | 'rebalance_portfolio'
    | 'reduce_risk_20'
    | 'committee_mode';
  decisionFlow?: {
    action: 'sell' | 'rebalance' | 'reduce_risk';
    ticker?: string;
    quantity?: number;
    sellPrice?: number;
    targetRiskReductionPct?: number;
  };
}): Promise<StructuredChatResponse> {
  const response = await aiAnalysisService.intelligentChat({
    question: input.question,
    investorProfile: input.investorProfile,
    copilotFlow: input.copilotFlow,
    decisionFlow: input.decisionFlow,
  });
  return normalizeChatResponse(response);
}
