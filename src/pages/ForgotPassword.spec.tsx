import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import ForgotPassword from './ForgotPassword';

// Mock do apiClient
vi.mock('@/server/api/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import apiClient from '@/server/api/api';

const renderForgotPassword = () => {
  const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o formulário de recuperação de senha', () => {
    renderForgotPassword();
    expect(screen.getByText(/Esqueceu sua senha?/i)).toBeDefined();
    expect(screen.getByLabelText(/E-mail/i)).toBeDefined();
    expect(screen.getByRole('button', {name: /Enviar Instruções/i})).toBeDefined();
  });

  it('deve exibir erro de validação ao submeter e-mail inválido', async () => {
    renderForgotPassword();
    const emailInput = screen.getByLabelText(/E-mail/i);
    await userEvent.type(emailInput, 'email-invalido');
    await userEvent.click(screen.getByRole('button', {name: /Enviar Instruções/i}));
    await waitFor(() => {
      expect(screen.getByText(/Digite um email válido/i)).toBeDefined();
    });
  });

  it('deve chamar a API de recuperação de senha com o e-mail correto', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({data: {success: true}});

    renderForgotPassword();

    await userEvent.type(screen.getByLabelText(/E-mail/i), 'joao@email.com');
    await userEvent.click(screen.getByRole('button', {name: /Enviar Instruções/i}));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'joao@email.com',
      });
    });
  });

  it('deve exibir a mensagem de sucesso após enviar o e-mail', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({data: {success: true}});

    renderForgotPassword();

    await userEvent.type(screen.getByLabelText(/E-mail/i), 'joao@email.com');
    await userEvent.click(screen.getByRole('button', {name: /Enviar Instruções/i}));

    await waitFor(() => {
      expect(screen.getByText(/Email enviado!/i)).toBeDefined();
      expect(screen.getByText(/joao@email\.com/i)).toBeDefined();
    });
  });

  it('deve permitir tentar outro e-mail ao clicar em "Tentar outro e-mail"', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({data: {success: true}});

    renderForgotPassword();

    await userEvent.type(screen.getByLabelText(/E-mail/i), 'joao@email.com');
    await userEvent.click(screen.getByRole('button', {name: /Enviar Instruções/i}));

    await waitFor(() => {
      expect(screen.getByText(/Email enviado!/i)).toBeDefined();
    });

    await userEvent.click(screen.getByRole('button', {name: /Tentar outro e-mail/i}));

    await waitFor(() => {
      expect(screen.getByText(/Esqueceu sua senha?/i)).toBeDefined();
    });
  });

  it('deve navegar para / ao clicar em "Voltar para o login"', async () => {
    renderForgotPassword();
    await userEvent.click(screen.getByText(/Voltar para o login/i));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
