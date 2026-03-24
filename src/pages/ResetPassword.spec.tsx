import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import ResetPassword from './ResetPassword';

// Mock do apiClient
vi.mock('@/server/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock do input-otp para evitar erros de DOM
vi.mock('@/components/ui/input-otp', () => ({
  InputOTP: ({children, ...props}: React.PropsWithChildren<object>) => (
    <div data-testid="otp-input" {...props}>{children}</div>
  ),
  InputOTPGroup: ({children}: React.PropsWithChildren) => <div>{children}</div>,
  InputOTPSlot: ({index}: {index: number}) => (
    <input data-testid={`otp-slot-${index}`} aria-label={`OTP slot ${index}`} />
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('token=valid-token-abc'), vi.fn()],
  };
});

import apiClient from '@/server/api/api';

const renderResetPassword = () => {
  const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir tela de carregamento enquanto valida o token', () => {
    // Deixamos o GET pendente para mostrar o estado de carregamento
    vi.mocked(apiClient.get).mockReturnValueOnce(new Promise(() => {}));
    renderResetPassword();
    expect(screen.getByTestId('reset-password-loading')).toBeDefined();
  });

  it('deve exibir o formulário quando o token é válido', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: false},
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByText(/Nova senha/i)).toBeDefined();
      expect(screen.getByLabelText(/Nova Senha/i)).toBeDefined();
      expect(screen.getByLabelText(/Confirmar Nova Senha/i)).toBeDefined();
      expect(screen.getByRole('button', {name: /Salvar Nova Senha/i})).toBeDefined();
    });
  });

  it('deve exibir tela de erro quando o token é inválido', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Token inválido'));

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-invalid')).toBeDefined();
      expect(screen.getByText(/Link inválido ou expirado/i)).toBeDefined();
    });
  });

  it('deve redirecionar para /forgot-password ao clicar em "Solicitar novo link"', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Token inválido'));

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-invalid')).toBeDefined();
    });

    await userEvent.click(screen.getByRole('button', {name: /Solicitar novo link/i}));
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('deve exibir erro de validação quando as senhas não coincidem', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: false},
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeDefined();
    });

    await userEvent.type(screen.getByLabelText(/Nova Senha/i), 'minhasenha123');
    await userEvent.type(screen.getByLabelText(/Confirmar Nova Senha/i), 'senhadiferente');
    await userEvent.click(screen.getByRole('button', {name: /Salvar Nova Senha/i}));

    await waitFor(() => {
      expect(screen.getByText(/As senhas não coincidem/i)).toBeDefined();
    });
  });

  it('deve exibir erro de validação para senha muito curta', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: false},
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeDefined();
    });

    await userEvent.type(screen.getByLabelText(/Nova Senha/i), 'abc');
    await userEvent.type(screen.getByLabelText(/Confirmar Nova Senha/i), 'abc');
    await userEvent.click(screen.getByRole('button', {name: /Salvar Nova Senha/i}));

    await waitFor(() => {
      expect(screen.getByText(/A senha deve ter no mínimo 8 caracteres/i)).toBeDefined();
    });
  });

  it('deve chamar a API com token e nova senha ao submeter o formulário', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: false},
    });
    vi.mocked(apiClient.post).mockResolvedValueOnce({data: {success: true}});

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeDefined();
    });

    await userEvent.type(screen.getByLabelText(/Nova Senha/i), 'novasenha123');
    await userEvent.type(screen.getByLabelText(/Confirmar Nova Senha/i), 'novasenha123');
    await userEvent.click(screen.getByRole('button', {name: /Salvar Nova Senha/i}));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'valid-token-abc',
        newPassword: 'novasenha123',
        tfCode: '',
      });
    });
  });

  it('deve exibir tela de sucesso após redefinir a senha com sucesso', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: false},
    });
    vi.mocked(apiClient.post).mockResolvedValueOnce({data: {success: true}});

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeDefined();
    });

    await userEvent.type(screen.getByLabelText(/Nova Senha/i), 'novasenha123');
    await userEvent.type(screen.getByLabelText(/Confirmar Nova Senha/i), 'novasenha123');
    await userEvent.click(screen.getByRole('button', {name: /Salvar Nova Senha/i}));

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-success')).toBeDefined();
      expect(screen.getByText(/Senha redefinida!/i)).toBeDefined();
    });
  });

  it('deve navegar para / ao clicar em "Ir para o Login" após sucesso', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: false},
    });
    vi.mocked(apiClient.post).mockResolvedValueOnce({data: {success: true}});

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByLabelText(/Nova Senha/i)).toBeDefined();
    });

    await userEvent.type(screen.getByLabelText(/Nova Senha/i), 'novasenha123');
    await userEvent.type(screen.getByLabelText(/Confirmar Nova Senha/i), 'novasenha123');
    await userEvent.click(screen.getByRole('button', {name: /Salvar Nova Senha/i}));

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-success')).toBeDefined();
    });

    await userEvent.click(screen.getByRole('button', {name: /Ir para o Login/i}));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('deve navegar para / ao clicar em "Voltar para o login"', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: false},
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByText(/Voltar para o login/i)).toBeDefined();
    });

    await userEvent.click(screen.getByText(/Voltar para o login/i));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('deve exibir o campo 2FA quando requiresMfa é true', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: true},
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByText(/Código de Autenticação \(2FA\)/i)).toBeDefined();
      expect(screen.getByTestId('otp-input')).toBeDefined();
    });
  });
});
