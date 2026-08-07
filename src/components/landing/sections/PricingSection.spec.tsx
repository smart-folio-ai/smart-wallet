import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
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
});
