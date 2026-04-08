import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import ResetPassword from './ResetPassword';

vi.mock('@/server/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

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

const fillResetForm = async (password: string, confirmPassword = password) => {
  const inputs = screen.getAllByPlaceholderText(/••••••••/);
  await userEvent.type(inputs[0], password);
  await userEvent.type(inputs[1], confirmPassword);
};

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deve exibir tela de carregamento enquanto valida o token', () => {
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
      expect(screen.getByRole('heading', {name: /^Nova senha$/i})).toBeDefined();
      expect(screen.getByRole('button', {name: /Salvar Nova Senha/i})).toBeDefined();
    });
  });

  it('deve exibir estado de token inválido', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({
      response: {data: {message: 'Token inválido'}},
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-invalid')).toBeDefined();
      expect(screen.getByText(/Link inválido/i)).toBeDefined();
    });
  });

  it('deve exibir estado de token expirado', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({
      response: {data: {message: 'Token expirado'}},
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-invalid')).toBeDefined();
      expect(screen.getByText(/Link expirado/i)).toBeDefined();
    });
  });

  it('deve redirecionar para /forgot-password ao clicar em solicitar novo link', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({
      response: {data: {message: 'Token inválido'}},
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-invalid')).toBeDefined();
    });

    await userEvent.click(screen.getByRole('button', {name: /Solicitar novo link/i}));
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('deve exibir erro quando as senhas não coincidem', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: false},
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText(/••••••••/)).toHaveLength(2);
    });

    await fillResetForm('Password123@', 'Different123@');
    await userEvent.click(screen.getByRole('button', {name: /Salvar Nova Senha/i}));

    await waitFor(() => {
      expect(screen.getByText(/As senhas não coincidem/i)).toBeDefined();
    });
  });

  it('deve exibir erro quando senha não tem caractere especial', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: false},
    });

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText(/••••••••/)).toHaveLength(2);
    });

    await fillResetForm('Password1234');
    await userEvent.click(screen.getByRole('button', {name: /Salvar Nova Senha/i}));

    await waitFor(() => {
      expect(screen.getByText(/A senha deve conter pelo menos 1 caractere especial/i)).toBeDefined();
    });
  });

  it('deve chamar API com token, nova senha e confirmação', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: false},
    });
    vi.mocked(apiClient.post).mockResolvedValueOnce({data: {success: true}});

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText(/••••••••/)).toHaveLength(2);
    });

    await fillResetForm('Password123@');
    await userEvent.click(screen.getByRole('button', {name: /Salvar Nova Senha/i}));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'valid-token-abc',
        newPassword: 'Password123@',
        confirmPassword: 'Password123@',
        tfCode: '',
      });
    });
  });

  it('deve exibir sucesso após redefinição', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {requiresMfa: false},
    });
    vi.mocked(apiClient.post).mockResolvedValueOnce({data: {success: true}});

    renderResetPassword();

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText(/••••••••/)).toHaveLength(2);
    });

    await fillResetForm('Password123@');
    await userEvent.click(screen.getByRole('button', {name: /Salvar Nova Senha/i}));

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-success')).toBeDefined();
    });
  });

  it('deve exibir campo 2FA quando requiresMfa é true', async () => {
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
