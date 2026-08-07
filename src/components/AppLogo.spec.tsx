import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {AppLogo} from './AppLogo';

describe('AppLogo', () => {
  it('renderiza a marca como texto de verdade, nao como imagem', () => {
    render(<AppLogo />);
    expect(screen.getByText('Trackerr')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('esconde o icone de leitores de tela, que leem o texto', () => {
    const {container} = render(<AppLogo />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('no modo icon nao renderiza a palavra', () => {
    render(<AppLogo variant="icon" />);
    expect(screen.queryByText('Trackerr')).not.toBeInTheDocument();
  });

  it('o anel de fundo herda a cor do tema via currentColor', () => {
    const {container} = render(<AppLogo />);
    const anel = container.querySelector('circle[stroke="currentColor"]');
    expect(anel).not.toBeNull();
  });
});
