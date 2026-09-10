import {describe, it, expect} from 'vitest';
import {
  ADAPTIVE_LEVELS,
  DEFAULT_LEVEL,
  isAdaptiveLevel,
  toAdaptiveLevel,
  toSophistication,
  type AdaptiveLevel,
  type SophisticationLevel,
} from './adaptive-level.mapping';

describe('adaptive-level.mapping', () => {
  it('traduz os três níveis do backend para a interface', () => {
    expect(toAdaptiveLevel('beginner')).toBe('iniciante');
    expect(toAdaptiveLevel('intermediate')).toBe('intermediario');
    expect(toAdaptiveLevel('experienced')).toBe('avancado');
  });

  it('traduz os três níveis da interface para o backend', () => {
    expect(toSophistication('iniciante')).toBe('beginner');
    expect(toSophistication('intermediario')).toBe('intermediate');
    expect(toSophistication('avancado')).toBe('experienced');
  });

  // O ponto do módulo é não perder o estado intermediário na tradução, que é
  // exatamente o que AIInsights fazia ao achatar três estados em dois.
  it('preserva os três estados na ida e na volta', () => {
    for (const level of ADAPTIVE_LEVELS) {
      expect(toAdaptiveLevel(toSophistication(level))).toBe(level);
    }
  });

  it('cai no default quando o backend manda algo desconhecido', () => {
    expect(toAdaptiveLevel('expert')).toBe(DEFAULT_LEVEL);
    expect(toAdaptiveLevel('')).toBe(DEFAULT_LEVEL);
    expect(toAdaptiveLevel(null)).toBe(DEFAULT_LEVEL);
    expect(toAdaptiveLevel(undefined)).toBe(DEFAULT_LEVEL);
  });

  it('reconhece apenas níveis válidos', () => {
    expect(isAdaptiveLevel('avancado')).toBe(true);
    expect(isAdaptiveLevel('advanced')).toBe(false);
    expect(isAdaptiveLevel(null)).toBe(false);
    expect(isAdaptiveLevel(3)).toBe(false);
  });

  // Guarda de tipo: se alguém adicionar um nível em um vocabulário e esquecer
  // o outro, o Record<> não compila. Este teste cobre o lado runtime.
  it('cobre todo o domínio dos dois vocabulários', () => {
    const sophistications: SophisticationLevel[] = [
      'beginner',
      'intermediate',
      'experienced',
    ];
    const levels: AdaptiveLevel[] = [...ADAPTIVE_LEVELS];

    expect(new Set(sophistications.map(toAdaptiveLevel)).size).toBe(3);
    expect(new Set(levels.map(toSophistication)).size).toBe(3);
  });
});
