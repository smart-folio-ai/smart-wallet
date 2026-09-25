import {describe, expect, it} from 'vitest';
import {classifyPixError, type PixCharge} from '@/services/pix';
import {formatCountdown, maskCpf, pixReducer, type PixStep} from './pix-checkout-state';

const charge = (overrides: Partial<PixCharge> = {}): PixCharge => ({
  chargeId: 'c1',
  status: 'pending',
  amount: 14.9,
  interval: 'month',
  qrCodePayload: 'copia',
  qrCodeImage: 'png',
  expiresAt: '2026-09-25T12:00:00Z',
  ...overrides,
});

describe('pixReducer (TRA-195)', () => {
  const awaiting: PixStep = {kind: 'awaiting', charge: charge()};

  it('cobrança criada mostra o QR', () => {
    expect(pixReducer({kind: 'creating'}, {type: 'charge_created', charge: charge()})).toEqual(awaiting);
  });

  it('cobrança reaproveitada que já estava paga vai direto ao sucesso', () => {
    expect(pixReducer({kind: 'creating'}, {type: 'charge_created', charge: charge({status: 'paid'})}).kind).toBe('paid');
  });

  it('primeira recusa por CPF pede o CPF sem mensagem de erro', () => {
    expect(
      pixReducer({kind: 'creating'}, {type: 'checkout_failed', errorKind: 'cpf_required', message: 'x'}),
    ).toEqual({kind: 'cpf', error: undefined});
  });

  it('recusa do CPF digitado mostra o erro no campo', () => {
    expect(
      pixReducer({kind: 'cpf'}, {type: 'checkout_failed', errorKind: 'cpf_required', message: 'CPF inválido'}),
    ).toEqual({kind: 'cpf', error: 'CPF inválido'});
  });

  it('409 vira erro de cartão ativo', () => {
    expect(
      pixReducer({kind: 'creating'}, {type: 'checkout_failed', errorKind: 'card_active', message: 'm'}),
    ).toMatchObject({kind: 'error', errorKind: 'card_active'});
  });

  it('polling pago → sucesso; expirado → expirado; pendente → segue aguardando', () => {
    expect(pixReducer(awaiting, {type: 'charge_updated', charge: charge({status: 'paid'})}).kind).toBe('paid');
    expect(pixReducer(awaiting, {type: 'charge_updated', charge: charge({status: 'expired'})}).kind).toBe('expired');
    expect(pixReducer(awaiting, {type: 'charge_updated', charge: charge()}).kind).toBe('awaiting');
  });

  it('pago mas em revisão não finge sucesso', () => {
    const next = pixReducer(awaiting, {type: 'charge_updated', charge: charge({status: 'needs_review'})});
    expect(next).toMatchObject({kind: 'error', errorKind: 'generic'});
  });

  it('polling atrasado não tira o usuário da tela de sucesso', () => {
    const paid: PixStep = {kind: 'paid', charge: charge({status: 'paid'})};
    expect(pixReducer(paid, {type: 'charge_updated', charge: charge()})).toBe(paid);
    expect(pixReducer(paid, {type: 'expired'})).toBe(paid);
  });
});

describe('maskCpf', () => {
  it.each([
    ['5', '5'],
    ['5299', '529.9'],
    ['5299822', '529.982.2'],
    ['529982247', '529.982.247'],
    ['5299822472', '529.982.247-2'],
    ['52998224725', '529.982.247-25'],
    ['529.982.247-25999', '529.982.247-25'],
    ['abc529def982', '529.982'],
  ])('%p → %p', (raw, masked) => expect(maskCpf(raw)).toBe(masked));
});

describe('formatCountdown', () => {
  const at = new Date('2026-09-25T12:00:00Z').getTime();
  it('minutos e segundos', () => expect(formatCountdown('2026-09-25T12:14:05Z', at)).toBe('14:05'));
  it('horas quando passa de 1 h', () => expect(formatCountdown('2026-09-26T11:30:00Z', at)).toBe('23h30'));
  it('nunca negativo', () => expect(formatCountdown('2026-09-25T11:00:00Z', at)).toBe('0:00'));
  it('sem data', () => expect(formatCountdown(undefined, at)).toBe('—'));
});

describe('classifyPixError', () => {
  const axiosError = (status: number, data: object) => ({response: {status, data}});

  it('CPF exigido', () => {
    expect(classifyPixError(axiosError(400, {error: 'PIX_CPF_REQUIRED', message: 'Informe'})).kind).toBe('cpf_required');
  });
  it('400 comum não é pedido de CPF', () => {
    expect(classifyPixError(axiosError(400, {message: ['plano inválido']}))).toEqual({
      kind: 'generic',
      message: 'plano inválido',
    });
  });
  it('409 e 503', () => {
    expect(classifyPixError(axiosError(409, {message: 'm'})).kind).toBe('card_active');
    expect(classifyPixError(axiosError(503, {message: 'm'})).kind).toBe('unavailable');
  });
  it('erro de rede', () => {
    expect(classifyPixError(new Error('Network Error')).kind).toBe('generic');
  });
});
