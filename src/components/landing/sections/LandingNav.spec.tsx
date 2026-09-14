import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {LandingNav} from './LandingNav';

describe('LandingNav', () => {
  it('mantém os links de entrar e criar conta', () => {
    render(
      <MemoryRouter>
        <LandingNav theme="dark" onToggleTheme={() => {}} />
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

  it('chama onToggleTheme ao clicar no botão de tema', () => {
    const onToggleTheme = vi.fn();
    render(
      <MemoryRouter>
        <LandingNav theme="dark" onToggleTheme={onToggleTheme} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', {name: /ativar tema claro/i}));

    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('rotula o botão de acordo com o tema atual', () => {
    const {rerender} = render(
      <MemoryRouter>
        <LandingNav theme="dark" onToggleTheme={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', {name: /ativar tema claro/i})).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <LandingNav theme="light" onToggleTheme={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', {name: /ativar tema escuro/i})).toBeInTheDocument();
  });
});
