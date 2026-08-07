import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {HeroSection} from './HeroSection';

const renderHero = () =>
  render(
    <MemoryRouter>
      <HeroSection />
    </MemoryRouter>,
  );

describe('HeroSection', () => {
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

  it('apresenta a promessa central', () => {
    renderHero();
    expect(screen.getByText(/sua carteira inteira/i)).toBeInTheDocument();
    expect(
      screen.getByText(/sem planilha, sem surpresa no ir/i),
    ).toBeInTheDocument();
  });

  it('oferece os dois caminhos: criar conta e ver o produto', () => {
    renderHero();
    expect(
      screen.getByRole('link', {name: /começar grátis/i}),
    ).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', {name: /ver como funciona/i})).toHaveAttribute(
      'href',
      '#produto',
    );
  });

  it('mostra a micro-prova que remove atrito da decisão', () => {
    renderHero();
    expect(screen.getByText(/grátis até 10 ativos/i)).toBeInTheDocument();
    expect(screen.getByText(/sem cartão de crédito/i)).toBeInTheDocument();
  });

  it('mostra o painel de produto com os números da carteira', () => {
    renderHero();
    expect(screen.getByText(/carteira consolidada/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gráfico em alta/i)).toBeInTheDocument();
    expect(screen.getByText(/retorno 30d/i)).toBeInTheDocument();
  });
});
