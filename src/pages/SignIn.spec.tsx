import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import SignIn from './SignIn';

// Mocks
vi.mock('../services/authentication', () => ({
  default: {
    authenticate: vi.fn(),
  },
}));

vi.mock('@/components/WalletLoadingScreen', () => ({
  default: ({isLoading}: {isLoading: boolean}) =>
    isLoading ? <div data-testid="loading-screen">Carregando...</div> : null,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({state: null, pathname: '/'}),
  };
});

import AuthenticationService from '../services/authentication';

const renderSignIn = () => {
  const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SignIn />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('SignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o formulário de login corretamente', () => {
    renderSignIn();
    expect(screen.getByText(/Entrar no Terminal/i)).toBeDefined();
    expect(screen.getByLabelText(/E-mail/i)).toBeDefined();
    expect(screen.getByLabelText(/Senha/i)).toBeDefined();
    expect(screen.getByRole('button', {name: /Entrar/i})).toBeDefined();
  });

  it('deve exibir erros de validação ao submeter o formulário vazio', async () => {
    renderSignIn();
    const submitBtn = screen.getByRole('button', {name: /Entrar/i});
    await userEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText(/Digite um email válido/i)).toBeDefined();
    });
  });

  it('deve exibir/ocultar a senha ao clicar no ícone correspondente', async () => {
    renderSignIn();
    const passwordInput = screen.getByLabelText(/Senha/i);
    expect(passwordInput).toHaveProperty('type', 'password');

    const toggleBtn = screen.getByRole('button', {name: /Mostrar senha/i});
    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveProperty('type', 'text');

    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveProperty('type', 'password');
  });

  it('deve chamar o serviço de autenticação com os dados corretos', async () => {
    vi.mocked(AuthenticationService.authenticate).mockResolvedValueOnce({
      success: true,
      requires2FA: false,
    } as never);

    renderSignIn();

    await userEvent.type(screen.getByLabelText(/E-mail/i), 'test@email.com');
    await userEvent.type(screen.getByLabelText(/Senha/i), 'senha123');
    await userEvent.click(screen.getByRole('button', {name: /Entrar/i}));

    await waitFor(() => {
      expect(AuthenticationService.authenticate).toHaveBeenCalledWith(
        'test@email.com',
        'senha123',
        false,
      );
    });
  });

  it('deve redirecionar para /2fa-verify quando 2FA é necessário', async () => {
    vi.mocked(AuthenticationService.authenticate).mockResolvedValueOnce({
      success: true,
      requires2FA: true,
    } as never);

    renderSignIn();

    await userEvent.type(screen.getByLabelText(/E-mail/i), 'test@email.com');
    await userEvent.type(screen.getByLabelText(/Senha/i), 'senha123');
    await userEvent.click(screen.getByRole('button', {name: /Entrar/i}));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/2fa-verify', {replace: true});
    });
  });

  it('deve mostrar erro quando as credenciais forem inválidas', async () => {
    vi.mocked(AuthenticationService.authenticate).mockResolvedValueOnce({
      success: false,
      requires2FA: false,
    } as never);

    renderSignIn();

    await userEvent.type(screen.getByLabelText(/E-mail/i), 'wrong@email.com');
    await userEvent.type(screen.getByLabelText(/Senha/i), 'senhaerrada');
    await userEvent.click(screen.getByRole('button', {name: /Entrar/i}));

    await waitFor(() => {
      expect(AuthenticationService.authenticate).toHaveBeenCalled();
    });
  });

  it('deve navegar para /register ao clicar em "Criar conta agora"', async () => {
    renderSignIn();
    const registerLink = screen.getByText(/Criar conta agora/i);
    await userEvent.click(registerLink);
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });
});
