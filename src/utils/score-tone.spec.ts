import {describe, it, expect} from 'vitest';
import {resolveScoreTone, SCORE_TONE_CLASSES} from './score-tone';

describe('resolveScoreTone', () => {
  it('null e neutral', () => {
    expect(resolveScoreTone(null)).toBe('neutral');
  });

  it('abaixo de 40 e warning', () => {
    expect(resolveScoreTone(0)).toBe('warning');
    expect(resolveScoreTone(39.9)).toBe('warning');
  });

  it('entre 40 e 79 e neutral', () => {
    expect(resolveScoreTone(40)).toBe('neutral');
    expect(resolveScoreTone(79.9)).toBe('neutral');
  });

  it('80 ou mais e positive', () => {
    expect(resolveScoreTone(80)).toBe('positive');
    expect(resolveScoreTone(100)).toBe('positive');
  });
});

describe('SCORE_TONE_CLASSES', () => {
  it('tem as tres tonalidades com as quatro chaves de classe', () => {
    (['warning', 'neutral', 'positive'] as const).forEach((tone) => {
      expect(SCORE_TONE_CLASSES[tone]).toHaveProperty('text');
      expect(SCORE_TONE_CLASSES[tone]).toHaveProperty('border');
      expect(SCORE_TONE_CLASSES[tone]).toHaveProperty('stroke');
      expect(SCORE_TONE_CLASSES[tone]).toHaveProperty('bg');
    });
  });
});
