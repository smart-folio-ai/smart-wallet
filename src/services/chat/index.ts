import {aiAnalysisService, AiChatResponse} from '@/services/ai';

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
    return {
      ...raw,
      message: String((raw as any).message || ''),
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

export async function askStructuredChat(question: string): Promise<StructuredChatResponse> {
  const response = await aiAnalysisService.chat({
    question,
  });
  return normalizeChatResponse(response);
}

