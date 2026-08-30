import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {LandingNav} from './LandingNav';

describe('LandingNav', () => {
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
