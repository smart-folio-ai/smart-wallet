import {pixService} from '@/server/api/api';

/** Espelha `PixChargeView` do server (TRA-195). */
export interface PixCharge {
  chargeId: string;
  status: 'pending' | 'paid' | 'expired' | 'refunded' | 'failed' | 'needs_review';
  amount: number;
  interval: 'month' | 'year';
  qrCodePayload?: string;
  /** PNG em base64, sem o prefixo `data:`. */
  qrCodeImage?: string;
  expiresAt?: string;
  periodEnd?: string;
}

export type PixInterval = PixCharge['interval'];

/**
 * Erros do checkout que mudam o que o modal mostra. O resto vira mensagem
 * genérica — o server já devolve texto legível para o usuário.
 */
export type PixCheckoutErrorKind = 'cpf_required' | 'card_active' | 'unavailable' | 'generic';

export function classifyPixError(error: unknown): {kind: PixCheckoutErrorKind; message: string} {
  const response = (error as {response?: {status?: number; data?: {error?: string; message?: string | string[]}}})
    ?.response;
  const raw = response?.data?.message;
  const message = (Array.isArray(raw) ? raw[0] : raw) || 'Não foi possível gerar a cobrança PIX. Tente de novo.';
  if (response?.status === 400 && response.data?.error === 'PIX_CPF_REQUIRED') return {kind: 'cpf_required', message};
  if (response?.status === 409) return {kind: 'card_active', message};
  if (response?.status === 503) return {kind: 'unavailable', message: 'Pagamento por PIX indisponível no momento.'};
  return {kind: 'generic', message};
}

class PixPaymentService {
  async isAvailable(): Promise<boolean> {
    try {
      const response = await pixService.availability();
      return response.data?.enabled === true;
    } catch {
      // Sem resposta = não oferecer PIX. Nunca mostrar opção que não cobra.
      return false;
    }
  }

  async checkout(planId: string, interval: PixInterval, cpf?: string): Promise<PixCharge> {
    const response = await pixService.checkout({planId, interval, ...(cpf ? {cpf} : {})});
    return response.data;
  }

  async getCharge(chargeId: string): Promise<PixCharge> {
    const response = await pixService.getCharge(chargeId);
    return response.data;
  }
}

export default new PixPaymentService();
