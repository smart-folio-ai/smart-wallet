import {describe, expect, it} from 'vitest';
import {CHECKOUT_FALLBACK_MESSAGE, checkoutErrorMessage} from './checkout-error';

const httpError = (status: number, data?: unknown) => ({response: {status, data}});

describe('checkoutErrorMessage', () => {
  it('mostra a regra de negócio que o server devolveu em 4xx', () => {
    expect(
      checkoutErrorMessage(
        httpError(400, {message: 'Plano sem preço configurado no Stripe. Contate o suporte.'}),
      ),
    ).toBe('Plano sem preço configurado no Stripe. Contate o suporte.');
  });

  it('usa a primeira mensagem quando a validação devolve lista', () => {
    expect(
      checkoutErrorMessage(httpError(400, {message: ['billingInterval inválido', 'outro']})),
    ).toBe('billingInterval inválido');
  });

  it('não expõe erro interno em 5xx', () => {
    expect(
      checkoutErrorMessage(httpError(500, {message: 'Cannot read properties of undefined'})),
    ).toBe(CHECKOUT_FALLBACK_MESSAGE);
  });

  it('cai na genérica sem resposta, sem mensagem ou com mensagem vazia', () => {
    expect(checkoutErrorMessage(new Error('Network Error'))).toBe(CHECKOUT_FALLBACK_MESSAGE);
    expect(checkoutErrorMessage(httpError(409, {}))).toBe(CHECKOUT_FALLBACK_MESSAGE);
    expect(checkoutErrorMessage(httpError(400, {message: '  '}))).toBe(CHECKOUT_FALLBACK_MESSAGE);
    expect(checkoutErrorMessage(undefined)).toBe(CHECKOUT_FALLBACK_MESSAGE);
  });
});
