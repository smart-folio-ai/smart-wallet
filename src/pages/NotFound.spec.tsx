import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import NotFound from './NotFound';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {...actual, useNavigate: () => mockNavigate};
});

describe('NotFound', () => {
  it('renders the on-brand 404 message with a link to the dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/rota-que-nao-existe']}>
        <NotFound />
      </MemoryRouter>,
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Essa posição saiu da carteira')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Ir para o dashboard'})).toHaveAttribute(
      'href',
      '/dashboard',
    );
  });

  // Um Link para "/" mandaria um usuário autenticado de volta pra Landing
  // pública, saindo do contexto do app — "Voltar" precisa navegar no
  // histórico do navegador, não pra rota "/".
  it('navigates back in history instead of linking to "/" (avoids dropping an authenticated user onto the public Landing)', () => {
    render(
      <MemoryRouter initialEntries={['/rota-que-nao-existe']}>
        <NotFound />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Voltar'}));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
