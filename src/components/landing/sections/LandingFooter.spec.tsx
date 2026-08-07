import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {LandingFooter} from './LandingFooter';
import {FinalCtaSection} from './FinalCtaSection';

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('LandingFooter', () => {
  it('tem colunas de navegação e o aviso legal', () => {
    wrap(<LandingFooter />);

    expect(screen.getByText('Produto')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: /política de privacidade/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não constituem recomendação de investimento/i),
    ).toBeInTheDocument();
  });

  it('renderiza âncoras in-page com plain <a> e rotas com Link', () => {
    wrap(<LandingFooter />);

    // Verifica que "Como funciona" é uma âncora plain <a> com href="#como-funciona"
    const comoFuncionaLink = screen.getByRole('link', {name: /como funciona/i});
    expect(comoFuncionaLink.tagName).toBe('A');
    expect(comoFuncionaLink).toHaveAttribute('href', '#como-funciona');

    // Verifica que "Política de privacidade" é um Link react-router com href="/privacidade"
    const privacidadeLink = screen.getByRole('link', {
      name: /política de privacidade/i,
    });
    expect(privacidadeLink).toHaveAttribute('href', '/privacidade');
  });
});

describe('FinalCtaSection', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  it('fecha com o convite e as garantias', () => {
    wrap(<FinalCtaSection />);

    expect(
      screen.getByText(/pare de consolidar carteira na mão/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/sem cartão para começar/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', {name: /criar conta gratuita/i}),
    ).toHaveAttribute('href', '/register');
  });
});
