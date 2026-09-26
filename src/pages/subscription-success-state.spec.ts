import {describe, expect, it} from 'vitest';
import {CONFIRMATION_TIMEOUT_MS, confirmationState, shouldPoll} from './subscription-success-state';

const withStatus = (status?: string) => ({subscription: status ? {status} : null, plan: {name: 'Pro'}}) as never;

describe('confirmationState', () => {
  it('ativa ou em teste = confirmada', () => {
    expect(confirmationState({data: withStatus('active'), isLoading: false, isError: false, elapsedMs: 0})).toBe('confirmed');
    expect(confirmationState({data: withStatus('trialing'), isLoading: false, isError: false, elapsedMs: 0})).toBe('confirmed');
  });

  it('sem assinatura ativa ainda = confirmando, e depois do limite = demorando', () => {
    expect(confirmationState({data: withStatus(), isLoading: false, isError: false, elapsedMs: 1000})).toBe('pending');
    expect(confirmationState({data: withStatus('incomplete'), isLoading: false, isError: false, elapsedMs: CONFIRMATION_TIMEOUT_MS})).toBe('delayed');
  });

  it('erro na consulta nunca vira "confirmada"', () => {
    expect(confirmationState({isLoading: false, isError: true, elapsedMs: 0})).toBe('error');
  });

  it('primeira carga = verificando', () => {
    expect(confirmationState({isLoading: true, isError: false, elapsedMs: 0})).toBe('checking');
  });

  it('só consulta de novo enquanto está verificando ou confirmando', () => {
    expect(shouldPoll('checking')).toBe(true);
    expect(shouldPoll('pending')).toBe(true);
    expect(shouldPoll('confirmed')).toBe(false);
    expect(shouldPoll('delayed')).toBe(false);
    expect(shouldPoll('error')).toBe(false);
  });
});
