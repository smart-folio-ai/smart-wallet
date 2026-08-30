import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {AuthTabs} from './AuthTabs';

describe('AuthTabs', () => {
  it('marca Entrar como ativo quando active="login"', () => {
    render(
      <MemoryRouter>
        <AuthTabs active="login" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', {name: 'Entrar'})).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', {name: 'Criar conta'}),
    ).not.toHaveAttribute('aria-current');
  });

  it('marca Criar conta como ativo quando active="register"', () => {
    render(
      <MemoryRouter>
        <AuthTabs active="register" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', {name: 'Criar conta'})).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', {name: 'Entrar'})).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('os dois links apontam pras rotas certas', () => {
    render(
      <MemoryRouter>
        <AuthTabs active="login" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', {name: 'Entrar'})).toHaveAttribute(
      'href',
      '/signin',
    );
    expect(screen.getByRole('link', {name: 'Criar conta'})).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
