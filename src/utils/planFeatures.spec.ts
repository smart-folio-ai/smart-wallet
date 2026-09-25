import {describe, expect, it} from 'vitest';
import {cumulativeFeatures} from './planFeatures';

const essencial = {_id: 'e', accessLevel: 0, price: 0, features: ['Suporte por e-mail', 'Research']};
const pro = {_id: 'p', accessLevel: 10, price: 19.9, features: ['Comparador', 'Suporte prioritário']};
const wealth = {_id: 'w', accessLevel: 20, price: 39.9, features: ['DARF']};

describe('cumulativeFeatures', () => {
  it('plano de cima herda tudo dos planos de baixo, na ordem', () => {
    const result = cumulativeFeatures([wealth, essencial, pro]);

    expect(result.get('e')).toEqual(['Suporte por e-mail', 'Research']);
    expect(result.get('p')).toEqual(['Suporte por e-mail', 'Research', 'Comparador', 'Suporte prioritário']);
    expect(result.get('w')).toEqual([
      'Suporte por e-mail',
      'Research',
      'Comparador',
      'Suporte prioritário',
      'DARF',
    ]);
  });

  it('não duplica recurso que o plano de cima já lista', () => {
    const result = cumulativeFeatures([essencial, {...pro, features: ['Research', 'Comparador']}]);

    expect(result.get('p')).toEqual(['Suporte por e-mail', 'Research', 'Comparador']);
  });

  it('mesmo nível: o mais barato fica abaixo', () => {
    const a = {_id: 'a', accessLevel: 10, price: 10, features: ['A']};
    const b = {_id: 'b', accessLevel: 10, price: 20, features: ['B']};

    const result = cumulativeFeatures([b, a]);

    expect(result.get('a')).toEqual(['A']);
    expect(result.get('b')).toEqual(['A', 'B']);
  });

  it('plano sem features ou sem nível não quebra', () => {
    const result = cumulativeFeatures([{_id: 'x', price: 0}, {_id: 'y', accessLevel: 10, price: 5, features: ['Y']}]);

    expect(result.get('x')).toEqual([]);
    expect(result.get('y')).toEqual(['Y']);
  });
});
