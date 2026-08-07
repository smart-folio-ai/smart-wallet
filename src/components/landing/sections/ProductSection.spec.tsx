import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ProductSection} from './ProductSection';

describe('ProductSection', () => {
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

  it('ancora em #produto para o CTA secundário do hero funcionar', () => {
    const {container} = render(<ProductSection />);
    expect(container.querySelector('#produto')).not.toBeNull();
  });

  it('apresenta os três blocos de produto', () => {
    render(<ProductSection />);
    expect(screen.getByText('Carteira consolidada')).toBeInTheDocument();
    expect(screen.getByText('IA que prioriza')).toBeInTheDocument();
    expect(screen.getByText('Fiscal resolvido')).toBeInTheDocument();
  });

  it('renderiza os três mockups, um por bloco', () => {
    // Cada mockup aparece duas vezes no DOM: uma na coluna mobile
    // (lg:hidden) e outra na coluna pinada (hidden lg:block). É proposital
    // (ver ProductSection.tsx), então usamos getAllByText e pegamos a
    // primeira ocorrência.
    render(<ProductSection />);
    expect(screen.getAllByText(/patrimônio consolidado/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/o que exige atenção/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/apuração de ir/i)[0]).toBeInTheDocument();
  });
});
