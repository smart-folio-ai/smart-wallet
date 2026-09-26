import type {CurrentSubscriptionResponse} from '@/interface/subscription';

export type ConfirmationState = 'checking' | 'confirmed' | 'pending' | 'delayed' | 'error';

export const CONFIRMATION_POLL_MS = 2_000;
export const CONFIRMATION_TIMEOUT_MS = 30_000;

const ACTIVE = new Set(['active', 'trialing']);

/**
 * O redirect do Stripe chega antes do webhook que cria a assinatura: até ela
 * aparecer ativa, a tela diz que está confirmando em vez de "confirmada"
 * (TRA-218).
 */
export function confirmationState(params: {
  data?: CurrentSubscriptionResponse;
  isLoading: boolean;
  isError: boolean;
  elapsedMs: number;
}): ConfirmationState {
  const status = params.data?.subscription?.status;
  if (status && ACTIVE.has(status)) return 'confirmed';
  if (params.isError) return 'error';
  if (params.isLoading && !params.data) return 'checking';
  return params.elapsedMs >= CONFIRMATION_TIMEOUT_MS ? 'delayed' : 'pending';
}

export function shouldPoll(state: ConfirmationState): boolean {
  return state === 'checking' || state === 'pending';
}
