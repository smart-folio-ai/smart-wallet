import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter} from 'react-router-dom';
import TwoFactorVerify from './TwoFactorVerify';
import {TEMP_TOKEN_STORAGE_KEY} from '@/services/authentication/session';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {...(actual as object), useNavigate: () => mockNavigate};
});

const apiPost = vi.fn();
vi.mock('@/server/api/api', () => ({
  api: {post: (...args: unknown[]) => apiPost(...args)},
}));

const consume = vi.fn();
vi.mock('@/services/two-factor/recovery-codes', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/two-factor/recovery-codes')
  >('@/services/two-factor/recovery-codes');
  return {
    ...actual,
    recoveryCodesService: {
      consume: (...args: unknown[]) => consume(...args),
      generate: vi.fn(),
      getStatus: vi.fn(),
    },
  };
});

vi.mock('@/hooks/use-app-toast', () => ({
  default: () => ({success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn()}),
  useAppToast: () => ({success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn()}),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <TwoFactorVerify />
    </MemoryRouter>,
  );

const switchToRecovery = async () =>
  userEvent.click(screen.getByRole('button', {name: /usar um código de recuperação/i}));

describe('TwoFactorVerify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem(TEMP_TOKEN_STORAGE_KEY, 'temp-token-123');
  });

  it('mantém o passo TOTP como caminho padrão', () => {
    renderPage();
    expect(screen.getByLabelText(/código de 6 dígitos/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /usar um código de recuperação/i}),
    ).toBeInTheDocument();
  });

  it('troca o campo para o código de recuperação e permite voltar', async () => {
    renderPage();
    await switchToRecovery();

    expect(screen.getByLabelText(/código de recuperação/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/código de 6 dígitos/i)).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', {name: /voltar para o código do autenticador/i}),
    );
    expect(screen.getByLabelText(/código de 6 dígitos/i)).toBeInTheDocument();
  });

  it('entra com um código de recuperação pelo mesmo caminho de sessão do TOTP', async () => {
    // O service real grava a sessão via establishSession; aqui simulamos isso
    // para provar que a página não escreve tokens por conta própria.
    consume.mockImplementation(async () => {
      localStorage.setItem('access_token', 'access-abc');
      localStorage.setItem('refresh_token', 'refresh-abc');
      sessionStorage.removeItem(TEMP_TOKEN_STORAGE_KEY);
    });

    renderPage();
    await switchToRecovery();
    await userEvent.type(screen.getByLabelText(/código de recuperação/i), 'A1B2-C3D4');
    await userEvent.click(
      screen.getByRole('button', {name: /entrar com código de recuperação/i}),
    );

    await waitFor(() =>
      expect(consume).toHaveBeenCalledWith('temp-token-123', 'A1B2-C3D4'),
    );
    expect(apiPost).not.toHaveBeenCalled();
    expect(localStorage.getItem('access_token')).toBe('access-abc');
    expect(sessionStorage.getItem(TEMP_TOKEN_STORAGE_KEY)).toBeNull();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {replace: true}),
    );
  });

  it('mostra a mensagem certa para código inválido ou já usado', async () => {
    const {RecoveryCodesError} = await import('@/services/two-factor/recovery-codes');
    consume.mockRejectedValue(
      new RecoveryCodesError(
        'invalid-recovery-code',
        'Código de recuperação inválido ou já usado',
        'Cada código funciona uma única vez. Tente outro da sua lista.',
      ),
    );

    renderPage();
    await switchToRecovery();
    await userEvent.type(screen.getByLabelText(/código de recuperação/i), 'ZZZZ-ZZZZ');
    await userEvent.click(
      screen.getByRole('button', {name: /entrar com código de recuperação/i}),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/inválido ou já usado/i);
    expect(mockNavigate).not.toHaveBeenCalled();
    // O campo é limpo para não deixar um código queimado à mostra.
    expect(screen.getByLabelText(/código de recuperação/i)).toHaveValue('');
  });

  it('manda refazer o login quando o rate limit invalida o tempToken', async () => {
    const {RecoveryCodesError} = await import('@/services/two-factor/recovery-codes');
    consume.mockRejectedValue(
      new RecoveryCodesError(
        'rate-limited',
        'Muitas tentativas — faça login novamente',
        'Por segurança, esta sessão de verificação foi encerrada após 5 tentativas em um minuto. Entre com e-mail e senha para recomeçar.',
      ),
    );

    renderPage();
    await switchToRecovery();
    await userEvent.type(screen.getByLabelText(/código de recuperação/i), 'A1B2-C3D4');
    await userEvent.click(
      screen.getByRole('button', {name: /entrar com código de recuperação/i}),
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/faça login novamente/i);
    // Sem tempToken válido não há o que tentar: o formulário é travado.
    expect(screen.getByLabelText(/código de recuperação/i)).toBeDisabled();
    expect(
      screen.getByRole('button', {name: /entrar com código de recuperação/i}),
    ).toBeDisabled();
    expect(screen.getByRole('button', {name: /voltar para o login/i})).toBeEnabled();
  });
});
