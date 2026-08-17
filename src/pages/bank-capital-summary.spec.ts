import {describe, it, expect} from 'vitest';
import {buildBankCapitalSummary} from './bank-capital-summary';

describe('buildBankCapitalSummary', () => {
  it('monta as duas frases quando os dois valores existem', () => {
    const result = buildBankCapitalSummary({basileia: 14.23, imobilizacao: 16.47});
    expect(result).toBe(
      'Índice de Basileia de 14,2%. Índice de Imobilização de 16,5%, dentro do limite regulatório de 50%.',
    );
  });

  it('acusa quando a imobilizacao passa do limite de 50%', () => {
    const result = buildBankCapitalSummary({basileia: 14.23, imobilizacao: 62.1});
    expect(result).toContain('acima do limite regulatório de 50%');
    expect(result).not.toContain('dentro do limite');
  });

  it('so a frase de basileia quando imobilizacao e null', () => {
    const result = buildBankCapitalSummary({basileia: 14.23, imobilizacao: null});
    expect(result).toBe('Índice de Basileia de 14,2%.');
  });

  it('so a frase de imobilizacao quando basileia e null', () => {
    const result = buildBankCapitalSummary({basileia: null, imobilizacao: 16.47});
    expect(result).toBe(
      'Índice de Imobilização de 16,5%, dentro do limite regulatório de 50%.',
    );
  });

  it('devolve null quando os dois sao null', () => {
    expect(buildBankCapitalSummary({basileia: null, imobilizacao: null})).toBeNull();
  });

  it('trata undefined como ausencia, igual a null', () => {
    const input = {basileia: undefined, imobilizacao: undefined} as unknown as {
      basileia: number | null;
      imobilizacao: number | null;
    };
    expect(buildBankCapitalSummary(input)).toBeNull();
  });

  it('nunca produz a string "0%" para um indicador ausente', () => {
    const result = buildBankCapitalSummary({basileia: null, imobilizacao: 16.47});
    expect(result).not.toContain('Basileia de 0%');
  });
});
