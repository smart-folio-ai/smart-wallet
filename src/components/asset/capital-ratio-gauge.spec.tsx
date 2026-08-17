import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {CapitalRatioGauge} from './capital-ratio-gauge';

describe('CapitalRatioGauge', () => {
  it('mostra o traco em vez de agulha quando o valor e null', () => {
    render(<CapitalRatioGauge label="ÍNDICE DE BASILEIA" value={null} maxScale={30} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(document.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renderiza o valor real formatado', () => {
    render(<CapitalRatioGauge label="ÍNDICE DE BASILEIA" value={14.23} maxScale={30} />);
    expect(screen.getByText('14,23%')).toBeInTheDocument();
  });

  it('sem dangerAbove, o arco usa uma cor unica, sem segmento vermelho', () => {
    render(<CapitalRatioGauge label="ÍNDICE DE BASILEIA" value={14.23} maxScale={30} />);
    const paths = document.querySelectorAll('svg path');
    const strokes = Array.from(paths).map((p) => p.getAttribute('stroke'));
    expect(strokes).not.toContain('#f43f5e');
  });

  it('com dangerAbove, o arco tem um segmento vermelho', () => {
    render(
      <CapitalRatioGauge
        label="ÍNDICE DE IMOBILIZAÇÃO"
        value={16.47}
        maxScale={60}
        dangerAbove={50}
      />,
    );
    const paths = document.querySelectorAll('svg path');
    const strokes = Array.from(paths).map((p) => p.getAttribute('stroke'));
    expect(strokes).toContain('#f43f5e');
  });

  it('nao deixa o valor passar da escala maxima na posicao da agulha', () => {
    const {container} = render(
      <CapitalRatioGauge label="ÍNDICE DE IMOBILIZAÇÃO" value={999} maxScale={60} dangerAbove={50} />,
    );
    const needle = container.querySelector('[data-testid="gauge-needle"]') as HTMLElement;
    expect(needle.style.transform).toContain('rotate(90deg)');
  });

  it('trata dangerAbove={0} como zona de perigo total, nao como ausencia', () => {
    render(
      <CapitalRatioGauge label="TESTE" value={10} maxScale={30} dangerAbove={0} />,
    );
    const paths = document.querySelectorAll('svg path');
    const strokes = Array.from(paths).map((p) => p.getAttribute('stroke'));
    expect(strokes).toContain('#f43f5e');
    expect(strokes).not.toContain('#94a3b8');
  });

  it('agulha em 0 quando o valor e 0, distinguivel de null', () => {
    const {container} = render(
      <CapitalRatioGauge label="ÍNDICE DE BASILEIA" value={0} maxScale={30} />,
    );
    expect(screen.queryByText('—')).not.toBeInTheDocument();
    const needle = container.querySelector('[data-testid="gauge-needle"]') as HTMLElement;
    expect(needle.style.transform).toContain('rotate(-90deg)');
  });
});
