import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Register from './Register';

// Mocks
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
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar os campos do formulário de cadastro', () => {
    renderRegister();
    expect(screen.getByText(/Criar conta/i)).toBeDefined();
    expect(screen.getByLabelText(/Nome/i)).toBeDefined();
    expect(screen.getByLabelText(/Sobrenome/i)).toBeDefined();
    expect(screen.getByLabelText(/E-mail/i)).toBeDefined();
    expect(screen.getAllByLabelText(/Senha/i)).toHaveLength(2);
    expect(screen.getByRole('button', {name: /Criar Conta/i})).toBeDefined();
  });

  it('deve exibir erros de validação ao submeter o formulário vazio', async () => {
    renderRegister();
    const submitBtn = screen.getByRole('button', {name: /Criar Conta/i});
    await userEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/O nome deve ter pelo menos 2 caracteres/i)).toBeDefined();
    });
  });

  it('deve exibir erro quando as senhas não correspondem', async () => {
    renderRegister();

    await userEvent.type(screen.getByLabelText(/Nome/i), 'João');
    await userEvent.type(screen.getByLabelText(/Sobrenome/i), 'Silva');
    await userEvent.type(screen.getByLabelText(/E-mail/i), 'joao@email.com');

    const senhaInputs = screen.getAllByPlaceholderText(/••••••••/);
    await userEvent.type(senhaInputs[0], 'senha123');
    await userEvent.type(senhaInputs[1], 'senhadiferente');

    await userEvent.click(screen.getByRole('button', {name: /Criar Conta/i}));

    await waitFor(() => {
      expect(screen.getByText(/As senhas não correspondem/i)).toBeDefined();
    });
  });

  it('deve exibir erro se os termos não forem aceitos', async () => {
    renderRegister();

    await userEvent.type(screen.getByLabelText(/Nome/i), 'João');
    await userEvent.type(screen.getByLabelText(/Sobrenome/i), 'Silva');
    await userEvent.type(screen.getByLabelText(/E-mail/i), 'joao@email.com');

    const senhaInputs = screen.getAllByPlaceholderText(/••••••••/);
    await userEvent.type(senhaInputs[0], 'senha123');
    await userEvent.type(senhaInputs[1], 'senha123');

    await userEvent.click(screen.getByRole('button', {name: /Criar Conta/i}));

    await waitFor(() => {
      expect(screen.getByText(/Você precisa aceitar os termos/i)).toBeDefined();
    });
  });

  it('deve chamar o serviço de registro com os dados corretos', async () => {
    vi.mocked(AuthenticationService.register).mockResolvedValueOnce(true as never);

    renderRegister();

    await userEvent.type(screen.getByLabelText(/Nome/i), 'João');
    await userEvent.type(screen.getByLabelText(/Sobrenome/i), 'Silva');
    await userEvent.type(screen.getByLabelText(/E-mail/i), 'joao@email.com');

    const senhaInputs = screen.getAllByPlaceholderText(/••••••••/);
    await userEvent.type(senhaInputs[0], 'senha123');
    await userEvent.type(senhaInputs[1], 'senha123');

    await userEvent.click(screen.getByLabelText(/Eu li e concordo/i));
    await userEvent.click(screen.getByRole('button', {name: /Criar Conta/i}));

    await waitFor(() => {
      expect(AuthenticationService.register).toHaveBeenCalledWith({
        firstName: 'João',
        lastName: 'Silva',
        email: 'joao@email.com',
        password: 'senha123',
        confirmPassword: 'senha123',
      });
    });
  });

  it('deve redirecionar para /dashboard após cadastro com sucesso', async () => {
    vi.mocked(AuthenticationService.register).mockResolvedValueOnce(true as never);

    renderRegister();

    await userEvent.type(screen.getByLabelText(/Nome/i), 'João');
    await userEvent.type(screen.getByLabelText(/Sobrenome/i), 'Silva');
    await userEvent.type(screen.getByLabelText(/E-mail/i), 'joao@email.com');

    const senhaInputs = screen.getAllByPlaceholderText(/••••••••/);
    await userEvent.type(senhaInputs[0], 'senha123');
    await userEvent.type(senhaInputs[1], 'senha123');

    await userEvent.click(screen.getByLabelText(/Eu li e concordo/i));
    await userEvent.click(screen.getByRole('button', {name: /Criar Conta/i}));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('deve navegar para / ao clicar em "Faça login"', async () => {
    renderRegister();
    const loginLink = screen.getByText(/Faça login/i);
    await userEvent.click(loginLink);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
