import {describe, expect, it} from 'vitest';
import {describeAsset} from './portfolio-asset-display.utils';

describe('describeAsset', () => {
  it('names a B3 fixed-income title by product and issuer instead of the bare code', () => {
    expect(
      describeAsset({symbol: '25F08539417', name: 'LCA - 25F08539417 - BANCO COOPERATIVO SICOOB'}),
    ).toEqual({badge: 'LCA', title: 'LCA · Banco Cooperativo Sicoob', subtitle: '25F08539417'});
  });

  it('keeps the ticker and turns the B3 company description into the second line', () => {
    expect(
      describeAsset({symbol: 'PETR4', name: 'PETR4 - PETROLEO BRASILEIRO S.A. PETROBRAS'}),
    ).toEqual({badge: 'PET', title: 'PETR4', subtitle: 'Petroleo Brasileiro S.A. Petrobras'});
  });

  it('omits the second line when the name only repeats the ticker', () => {
    expect(describeAsset({symbol: 'BTC', name: 'BTC'})).toEqual({badge: 'BTC', title: 'BTC', subtitle: undefined});
  });
});

describe('describeAsset — siglas', () => {
  it('keeps FII uppercase in the company description', () => {
    expect(
      describeAsset({symbol: 'IRIM11', name: 'IRIM11 - IRIDIUM RECEBIVEIS IMOBILIARIOS FII'}).subtitle,
    ).toBe('Iridium Recebiveis Imobiliarios FII');
  });
});
