import {describe, it, expect} from 'vitest';
import {
  heroCopy,
  problemCopy,
  productCopy,
  faqItems,
  footerColumns,
} from './landing-data';

const JARGAO = /revolucion|inovador|disruptiv/i;

describe('landing-data', () => {
  it('o hero fala do problema do usuário, não das nossas features', () => {
    expect(heroCopy.title).toMatch(/sua carteira inteira/i);
    expect(heroCopy.subtitle).toMatch(/corretoras/i);
    expect(heroCopy.primaryCta.href).toBe('/register');
    expect(heroCopy.secondaryCta.href).toBe('#produto');
    expect(heroCopy.microProof.length).toBeGreaterThanOrEqual(2);
  });

  it('a seção de problema tem exatamente três dores', () => {
    expect(problemCopy.cards).toHaveLength(3);
  });

  it('a seção de produto tem os três blocos esperados', () => {
    expect(productCopy.blocks.map((b) => b.id)).toEqual([
      'carteira',
      'ia',
      'fiscal',
    ]);
  });

  it('o FAQ cobre as quatro objeções principais', () => {
    expect(faqItems.length).toBeGreaterThanOrEqual(4);
    const perguntas = faqItems.map((f) => f.question).join(' ');
    expect(perguntas).toMatch(/segur|dados/i);
    expect(perguntas).toMatch(/corretora/i);
    expect(perguntas).toMatch(/cancel/i);
    expect(perguntas).toMatch(/gr[áa]tis|gratuito/i);
  });

  it('o rodapé tem colunas com links', () => {
    expect(footerColumns.length).toBeGreaterThanOrEqual(3);
    footerColumns.forEach((col) => {
      expect(col.links.length).toBeGreaterThan(0);
    });
  });

  it('não usa jargão de marketing proibido', () => {
    const tudo = JSON.stringify([heroCopy, problemCopy, productCopy, faqItems]);
    expect(tudo).not.toMatch(JARGAO);
  });
});
