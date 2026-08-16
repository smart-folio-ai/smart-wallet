import {describe, it, expect} from 'vitest';
import {readIndicator} from './asset-fundamentals.utils';

const FUNDAMENTALS = {
  symbol: 'WEGE3',
  sector: 'Máquinas e Equipamentos',
  mixed: false,
  values: {
    roic: {status: 'ok', value: 24.3, source: 'fundamentus'},
    netMargin: {status: 'ok', value: 0, source: 'fundamentus'},
    payout: {status: 'unavailable', value: null, source: null},
    netDebt: {status: 'not_applicable', value: null, source: null},
  },
};

describe('readIndicator', () => {
  it('devolve valor e origem', () => {
    expect(readIndicator(FUNDAMENTALS, 'roic')).toEqual({
      status: 'ok',
      value: 24.3,
      source: 'fundamentus',
    });
  });

  it('preserva zero legitimo', () => {
    const result = readIndicator(FUNDAMENTALS, 'netMargin');
    expect(result.status).toBe('ok');
    expect(result.value).toBe(0);
  });

  it('propaga not_applicable', () => {
    expect(readIndicator(FUNDAMENTALS, 'netDebt').status).toBe(
      'not_applicable',
    );
  });

  it('trata chave inexistente como indisponivel, nunca como zero', () => {
    const result = readIndicator(FUNDAMENTALS, 'evEbitda');
    expect(result).toEqual({status: 'unavailable', value: null, source: null});
  });

  it('trata fundamentals nulo como indisponivel', () => {
    expect(readIndicator(null, 'roic')).toEqual({
      status: 'unavailable',
      value: null,
      source: null,
    });
  });

  it('ignora status desconhecido vindo do server', () => {
    const estranho = {values: {roic: {status: 'talvez', value: 9, source: 'x'}}};
    expect(readIndicator(estranho, 'roic').status).toBe('unavailable');
  });
});
