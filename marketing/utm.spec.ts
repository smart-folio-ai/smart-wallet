import {describe, it, expect} from 'vitest';
import {buildLandingUrl, assertValidUtmValue} from './utm';

describe('assertValidUtmValue', () => {
  it('accepts letters, numbers, dot, hyphen and underscore', () => {
    expect(() => assertValidUtmValue('validacao_2026.08-a', 'campaign')).not.toThrow();
  });

  it('rejects a value with a space', () => {
    expect(() => assertValidUtmValue('black friday', 'campaign')).toThrow(/campaign/);
  });

  it('rejects a value with an accent', () => {
    expect(() => assertValidUtmValue('validação', 'campaign')).toThrow(/campaign/);
  });

  it('rejects a value longer than 64 characters', () => {
    expect(() => assertValidUtmValue('a'.repeat(65), 'campaign')).toThrow(/campaign/);
  });

  it('accepts a value of exactly 64 characters', () => {
    expect(() => assertValidUtmValue('a'.repeat(64), 'campaign')).not.toThrow();
  });
});

describe('buildLandingUrl', () => {
  it('builds the landing url with the three utm params', () => {
    expect(buildLandingUrl('instagram', 'validacao')).toBe(
      'https://trakkerwallet.com.br/?utm_source=instagram&utm_medium=social&utm_campaign=validacao',
    );
  });

  it('refuses to build a link from an invalid campaign', () => {
    expect(() => buildLandingUrl('x', 'black friday')).toThrow(/campaign/);
  });
});
