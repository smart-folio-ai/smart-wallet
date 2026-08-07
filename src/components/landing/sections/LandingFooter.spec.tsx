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
