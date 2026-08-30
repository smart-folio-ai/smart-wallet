import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {LandingNav} from './LandingNav';

describe('LandingNav', () => {
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

  it('tem um controle para alternar o tema', () => {
    render(
      <MemoryRouter>
        <LandingNav />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('button', {name: /toggle theme/i}),
    ).toBeInTheDocument();
  });

  it('mantém os links de entrar e criar conta', () => {
    render(
      <MemoryRouter>
        <LandingNav />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', {name: /entrar/i})).toHaveAttribute(
      'href',
      '/signin',
    );
    expect(screen.getByRole('link', {name: /criar conta/i})).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
