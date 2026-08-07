import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

/**
 * O bug clássico de um sistema de dois temas é um token definido num tema e
 * esquecido no outro: a página passa a misturar texto de um tema com fundo do
 * outro, e ninguém percebe até alguém usar o toggle. Este teste lê o CSS e
 * exige que os dois blocos declarem exatamente o mesmo conjunto de nomes.
 */
function extrairTokens(css: string, seletor: string): string[] {
  const inicio = css.indexOf(seletor);
  if (inicio === -1) throw new Error(`Bloco ${seletor} não encontrado`);

  // Caminha do primeiro "{" até a chave que o fecha, contando aninhamento.
  const abre = css.indexOf('{', inicio);
  let profundidade = 0;
  let fim = abre;
  for (let i = abre; i < css.length; i++) {
    if (css[i] === '{') profundidade++;
    if (css[i] === '}') {
      profundidade--;
      if (profundidade === 0) {
        fim = i;
        break;
      }
    }
  }

  const corpo = css.slice(abre + 1, fim);
  return [...corpo.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)]
    .map((m) => m[1])
    .sort();
}

describe('paridade de tokens entre os temas', () => {
  const css = readFileSync(resolve(__dirname, 'index.css'), 'utf8');

  it(':root e .dark declaram exatamente o mesmo conjunto de tokens', () => {
    const claro = extrairTokens(css, ':root {');
    const escuro = extrairTokens(css, '.dark {');

    const soNoClaro = claro.filter((t) => !escuro.includes(t));
    const soNoEscuro = escuro.filter((t) => !claro.includes(t));

    expect({soNoClaro, soNoEscuro}).toEqual({soNoClaro: [], soNoEscuro: []});
  });

  it('define os tokens canônicos de superfície e texto', () => {
    const escuro = extrairTokens(css, '.dark {');
    for (const token of [
      '--surface-base',
      '--surface-panel',
      '--surface-raised',
      '--surface-input',
      '--surface-hairline',
      '--on-surface',
      '--on-surface-accent',
      '--on-surface-muted',
      '--on-surface-subtle',
      '--accent-positive',
      '--accent-negative',
    ]) {
      expect(escuro).toContain(token);
    }
  });
});
