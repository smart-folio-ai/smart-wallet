import {describe, it, expect} from 'vitest';
import {
  buildExposureRowsFromBuckets,
  describeLargestGap,
  deviationColor,
  toDeviation,
} from './composition-display.utils';
import type {BucketGap} from '@/hooks/usePortfolioComposition';

const gap = (overrides: Partial<BucketGap> = {}): BucketGap => ({
  bucket: 'stocks',
  currentPct: 56.2,
  targetPct: 50,
  // Convenção do servidor: alvo − atual.
  gapPct: -6.2,
  amount: -48900,
  ...overrides,
});

describe('toDeviation', () => {
  // O ponto do módulo: o servidor e o handoff falam em sentidos opostos.
  it('inverte a convenção do servidor para a do handoff', () => {
    // Servidor: -6,2 (sobra, vender). Handoff: +6,2 (acima da meta).
    expect(toDeviation(-6.2)).toBeCloseTo(6.2, 6);
    expect(toDeviation(3)).toBeCloseTo(-3, 6);
  });
});

describe('describeLargestGap', () => {
  it('reproduz a linha do card Alocação do handoff', () => {
    const line = describeLargestGap(gap());

    // Protótipo: "Desvio do alvo: +6,2 p.p. em Ações · rebalanceamento
    // sugerido de R$ 48.900."
    expect(line?.highlight).toBe('+6,2 p.p. em Ações');
    expect(line?.amount).toMatch(/^R\$\s?48\.900$/);
  });

  it('mostra o valor de rebalanceamento em módulo, sem sinal', () => {
    const line = describeLargestGap(gap({gapPct: 4, amount: 12000}));

    expect(line?.highlight).toBe('-4,0 p.p. em Ações');
    expect(line?.amount).toMatch(/^R\$\s?12\.000$/);
  });

  it('usa o rótulo pt-BR do balde', () => {
    expect(describeLargestGap(gap({bucket: 'fiis'}))?.highlight).toContain(
      'em FIIs',
    );
    expect(describeLargestGap(gap({bucket: 'other'}))?.highlight).toContain(
      'em Outros',
    );
  });

  // Carteira alinhada não ganha linha de alerta com "+0,0 p.p.".
  it('não gera linha quando o desvio está dentro da tolerância', () => {
    expect(describeLargestGap(gap({gapPct: 0.01, amount: 10}))).toBeNull();
  });

  it('não gera linha sem meta configurada', () => {
    expect(describeLargestGap(null)).toBeNull();
    expect(describeLargestGap(undefined)).toBeNull();
  });
});

describe('buildExposureRowsFromBuckets', () => {
  it('converte baldes em linhas com desvio na convenção do handoff', () => {
    const rows = buildExposureRowsFromBuckets(
      [
        gap({bucket: 'stocks', currentPct: 60, targetPct: 50, gapPct: -10}),
        gap({bucket: 'fiis', currentPct: 40, targetPct: 50, gapPct: 10}),
      ],
      10000,
    );

    expect(rows[0]).toMatchObject({
      bucket: 'stocks',
      label: 'Ações',
      value: 6000,
      pct: 60,
      target: 50,
      dev: 10,
    });
    expect(rows[1].dev).toBe(-10);
  });

  it('ordena por peso, como o card fazia antes', () => {
    const rows = buildExposureRowsFromBuckets(
      [
        gap({bucket: 'crypto', currentPct: 5, gapPct: 0}),
        gap({bucket: 'stocks', currentPct: 70, gapPct: 0}),
      ],
      1000,
    );

    expect(rows.map((r) => r.bucket)).toEqual(['stocks', 'crypto']);
  });

  it('devolve lista vazia sem baldes', () => {
    expect(buildExposureRowsFromBuckets([], 1000)).toEqual([]);
  });
});

describe('deviationColor', () => {
  // --neg é "resultado negativo / ação destrutiva, sempre com ícone" no
  // handoff. Estar abaixo da meta não é nenhum dos dois.
  it('usa --warn para desvio material nos dois sentidos, nunca --neg', () => {
    expect(deviationColor(6.2)).toBe('var(--warn)');
    expect(deviationColor(-6.2)).toBe('var(--warn)');
  });

  it('usa --pos dentro da tolerância', () => {
    expect(deviationColor(2)).toBe('var(--pos)');
    expect(deviationColor(-2)).toBe('var(--pos)');
  });
});
