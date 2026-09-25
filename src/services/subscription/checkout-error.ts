export const CHECKOUT_FALLBACK_MESSAGE =
  'O pagamento está indisponível agora. Tente novamente em instantes.';

/**
 * Em 4xx o server explica a regra que barrou o checkout (plano sem preço no
 * Stripe, anual indisponível...). Em 5xx ou falha de rede a mensagem é
 * interna, então fica a genérica.
 */
export function checkoutErrorMessage(error: unknown): string {
  const response = (error as {response?: {status?: number; data?: unknown}})?.response;
  const status = response?.status ?? 0;
  if (status < 400 || status >= 500) return CHECKOUT_FALLBACK_MESSAGE;

  const raw = (response?.data as {message?: unknown} | undefined)?.message;
  const message = Array.isArray(raw) ? raw[0] : raw;
  return typeof message === 'string' && message.trim()
    ? message.trim()
    : CHECKOUT_FALLBACK_MESSAGE;
}
