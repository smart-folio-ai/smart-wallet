import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Register from './Register';

vi.mock('../services/authentication', () => ({
  default: {
    register: vi.fn(),
  },
}));

vi.mock('@/components/loader', () => ({
  default: ({text}: {text: string}) => <div data-testid="loader">{text}</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import AuthenticationService from '../services/authentication';

const renderRegister = () => {
  const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const getInput = (id: string) => document.querySelector(id) as HTMLInputElement;

const fillBaseForm = async (password: string, confirmPassword = password) => {
  await userEvent.type(getInput('#register-firstname'), 'João');
  await userEvent.type(getInput('#register-lastname'), 'Silva');
  await userEvent.type(getInput('#register-email'), 'joao@email.com');

  const senhaInputs = screen.getAllByPlaceholderText(/••••••••/);
  await userEvent.type(senhaInputs[0], password);
  await userEvent.type(senhaInputs[1], confirmPassword);
};

describe('Register', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deve renderizar estrutura principal do formulário', () => {
    renderRegister();
    expect(screen.getByRole('heading', {name: /Criar conta/i})).toBeDefined();
    expect(getInput('#register-firstname')).toBeTruthy();
    expect(getInput('#register-lastname')).toBeTruthy();
    expect(getInput('#register-email')).toBeTruthy();
    expect(screen.getAllByPlaceholderText(/••••••••/)).toHaveLength(2);
  });

  it('deve exibir erro para senha sem caractere especial', async () => {
    renderRegister();
    await fillBaseForm('Password1234');
    await userEvent.click(getInput('#register-accept-terms'));
    await userEvent.click(screen.getByRole('button', {name: /Criar Conta/i}));

    await waitFor(() => {
      expect(screen.getByText(/A senha deve conter pelo menos 1 caractere especial/i)).toBeDefined();
    });
  });

  it('deve exibir erro para senha fraca por outros critérios', async () => {
    renderRegister();
    await fillBaseForm('password123@');
    await userEvent.click(getInput('#register-accept-terms'));
    await userEvent.click(screen.getByRole('button', {name: /Criar Conta/i}));

    await waitFor(() => {
      expect(screen.getByText(/A senha deve conter pelo menos 1 letra maiúscula/i)).toBeDefined();
    });
  });

  it('deve exibir erro quando confirmação diverge', async () => {
    renderRegister();
    await fillBaseForm('Password123@', 'Different123@');
    await userEvent.click(getInput('#register-accept-terms'));
    await userEvent.click(screen.getByRole('button', {name: /Criar Conta/i}));

    await waitFor(() => {
      expect(screen.getByText(/As senhas não correspondem/i)).toBeDefined();
    });
  });

  it('deve chamar registro com dados corretos quando válido', async () => {
    vi.mocked(AuthenticationService.register).mockResolvedValueOnce(true as never);
    renderRegister();

    await fillBaseForm('Password123@');
    await userEvent.click(getInput('#register-accept-terms'));
    await userEvent.click(screen.getByRole('button', {name: /Criar Conta/i}));

    await waitFor(() => {
      expect(AuthenticationService.register).toHaveBeenCalledWith({
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao@email.com',
        password: 'Password123@',
        confirmPassword: 'Password123@',
      });
    });
  });

  it('deve navegar para dashboard após sucesso', async () => {
    vi.mocked(AuthenticationService.register).mockResolvedValueOnce(true as never);
    renderRegister();

    await fillBaseForm('Password123@');
    await userEvent.click(getInput('#register-accept-terms'));
    await userEvent.click(screen.getByRole('button', {name: /Criar Conta/i}));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
