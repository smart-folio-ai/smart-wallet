import {describe, it, expect} from 'vitest';
import {render} from '@testing-library/react';
import {CapitalRatioGauge} from './capital-ratio-gauge';

/**
 * Os medidores apareciam como um bico, não como um semicírculo.
 *
 * Causa: o sweep-flag do arco SVG estava em 0. No SVG o eixo Y cresce
 * para baixo, então o arco que sobe pela esquerda, passa pelo topo e
 * desce à direita é o sentido HORÁRIO — sweep-flag 1. Com 0, cada faixa
 * curvava para o lado oposto.
 *
 * Os testes existentes liam rótulos e valores, então passavam com o
 * desenho quebrado. Este fixa a geometria.
 */
describe('CapitalRatioGauge — geometria do arco', () => {
  const paths = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('path')).map(
      (path) => path.getAttribute('d') ?? '',
    );

  it('desenha os arcos no sentido horário (sweep-flag 1)', () => {
    const {container} = render(
      <CapitalRatioGauge label="Índice de Basileia" value={14.23} maxScale={30} />,
    );

    const arcs = paths(container).filter((d) => d.includes('A '));
    expect(arcs.length).toBeGreaterThan(0);

    for (const d of arcs) {
      // "A rx ry rotacao large-arc sweep x y" — o penúltimo par de flags.
      expect(d).toMatch(/A [\d.]+ [\d.]+ 0 0 1 /);
      expect(d).not.toMatch(/A [\d.]+ [\d.]+ 0 0 0 /);
    }
  });

  it('o arco começa à esquerda e termina à direita do centro', () => {
    const {container} = render(
      <CapitalRatioGauge label="Índice de Basileia" value={14.23} maxScale={30} />,
    );

    const trilho = paths(container).find((d) => d.includes('A '))!;
    // M startX startY A rx ry rotacao large-arc sweep endX endY
    const numeros = trilho.match(/-?[\d.]+/g)!.map(Number);
    const startX = numeros[0];
    const endX = numeros[7];

    // Semicírculo de verdade: começa à esquerda, termina à direita.
    expect(startX).toBeLessThan(endX);
  });
});
