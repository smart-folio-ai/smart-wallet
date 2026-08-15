import {describe, it, expect} from 'vitest';
import {render} from '@testing-library/react';
import {RobotIcon} from './robot-icon';

describe('RobotIcon', () => {
  it('renderiza um svg acessível como imagem decorativa', () => {
    const {container} = render(<RobotIcon />);
    const svg = container.querySelector('svg');

    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('herda a cor do texto em vez de fixar uma cor', () => {
    const {container} = render(<RobotIcon />);
    const svg = container.querySelector('svg');

    expect(svg?.innerHTML).toContain('currentColor');
  });

  it('não declara animação', () => {
    const {container} = render(<RobotIcon />);

    expect(container.querySelector('animate')).toBeNull();
    expect(container.querySelector('animateTransform')).toBeNull();
    expect((container.firstElementChild as HTMLElement).className).not.toContain(
      'animate-',
    );
  });
});
