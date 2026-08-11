import {describe, it, expect} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {PricingSection} from './PricingSection';

describe('PricingSection', () => {
  it('ancora em #planos e mostra os três planos', () => {
    const {container} = render(
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>,
    );

    expect(container.querySelector('#planos')).not.toBeNull();
    expect(screen.getByText('Básico')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Global Investor')).toBeInTheDocument();
  });

  it('destaca o Premium como mais escolhido', () => {
    render(
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>,
    );

    expect(screen.getByText(/mais escolhido/i)).toBeInTheDocument();
  });

  it('mantém o CTA do plano Básico como link direto para /register', () => {
    render(
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>,
    );

    const basicoCta = screen.getByRole('link', {name: 'Começar grátis'});
    expect(basicoCta).toHaveAttribute('href', '/register');
  });

  it('abre o modal de captura ao clicar em "Assinar Premium", em vez de navegar', () => {
    render(
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>,
    );

    const premiumCta = screen.getByRole('button', {name: 'Assinar Premium'});
    fireEvent.click(premiumCta);

    expect(screen.getByText(/Quero o plano Premium/i)).toBeInTheDocument();
  });

  it('abre o modal de captura ao clicar em "Falar com especialista", em vez de navegar', () => {
    render(
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>,
    );

    const globalCta = screen.getByRole('button', {name: 'Falar com especialista'});
    fireEvent.click(globalCta);

    expect(screen.getByText(/Quero o plano Global Investor/i)).toBeInTheDocument();
  });
});
