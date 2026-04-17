import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import Landing from './Landing';

describe('Landing', () => {
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

  it('renderiza hero premium com branding forte e sinais visuais de mercado', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getAllByAltText('trackerr').length).toBeGreaterThan(0);
    expect(screen.getAllByText('trackerr').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/seu terminal de mercado para decidir mais rápido e melhor/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/gráfico em alta/i)).toBeInTheDocument();
    expect(screen.getByText(/trackerr index/i)).toBeInTheDocument();
    expect(screen.getAllByText(/PETR4/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/retorno 30d/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /IA em carteira, portfólio, fiscal, RI e comparador com priorização prática/i,
      ),
    ).toBeInTheDocument();
  });
});
