import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {AxiosError, AxiosHeaders} from 'axios';
import Security from './Security';
import {authService, twoFactorService} from '@/server/api/api';
import Profile from '@/services/profile';

vi.mock('@/server/api/api', () => ({
  authService: {changePassword: vi.fn()},
  twoFactorService: {setup: vi.fn(), verify: vi.fn(), disable: vi.fn()},
}));

vi.mock('@/services/profile', () => ({
  default: {getProfile: vi.fn()},
}));

vi.mock('@/services/two-factor/recovery-codes', () => ({
  RecoveryCodesError: class extends Error {},
  recoveryCodesService: {
    getStatus: vi.fn().mockResolvedValue({total: 10, remaining: 10, generatedAt: '2026-01-01T00:00:00.000Z'}),
    generate: vi.fn(),
  },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('@/hooks/use-app-toast', () => {
  const hook = () => ({success: toastSuccess, error: toastError, warning: vi.fn(), info: vi.fn()});
  return {default: hook, useAppToast: hook};
});

const mocked = <T,>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>;

function renderPage() {
  const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Security />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const type = (placeholder: string, value: string) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), {target: {value}});

describe('Security — tela de Segurança do handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked(Profile.getProfile).mockResolvedValue({id: 'u1', twoFactorEnabled: false});
    mocked(twoFactorService.setup).mockResolvedValue({
      data: {secret: 'ABCDEFGHIJKLMNOP', qrCodeDataUrl: 'data:image/png;base64,QR'},
    });
    mocked(authService.changePassword).mockResolvedValue({data: {message: 'ok'}});
    mocked(twoFactorService.verify).mockResolvedValue({data: {message: 'ok'}});
  });

  it('renderiza os dois cards com o texto do handoff', async () => {
    renderPage();
    expect(screen.getByRole('heading', {name: 'Trocar senha'})).toBeInTheDocument();
    expect(screen.getByText('Você será desconectado dos outros dispositivos')).toBeInTheDocument();
    expect(screen.getByText('Senha atual')).toBeInTheDocument();
    expect(screen.getByText('Nova senha')).toBeInTheDocument();
    expect(screen.getByText('Confirmar nova senha')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Salvar nova senha'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Autenticação em dois fatores'})).toBeInTheDocument();
    expect(screen.getByText('Instale um app autenticador')).toBeInTheDocument();
    expect(screen.getByText('Escaneie este QR code')).toBeInTheDocument();
    expect(screen.getByText('Digite o código de 6 dígitos')).toBeInTheDocument();
    expect(screen.getByText(/Guarde os códigos de recuperação em local seguro/)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('two-factor-badge')).toHaveTextContent('Pendente'));
    const qr = await screen.findByAltText('QR code para configurar o app autenticador');
    expect(qr).toHaveAttribute('src', 'data:image/png;base64,QR');
    expect(screen.getByText(/ABCD EFGH IJKL MNOP/)).toBeInTheDocument();
  });

  it('atualiza força e regras enquanto a senha é digitada', () => {
    renderPage();
    const meter = screen.getByTestId('password-strength-meter');
    expect(meter).toHaveAttribute('data-score', '0');

    type('mínimo 10 caracteres', 'abc');
    expect(meter).toHaveAttribute('data-score', '1');
    expect(screen.getByText(/Força: fraca/)).toBeInTheDocument();

    type('mínimo 10 caracteres', 'Senha#Forte2026');
    expect(meter).toHaveAttribute('data-score', '4');
    expect(screen.getByText(/Força: forte · 15 caracteres/)).toBeInTheDocument();
    expect(screen.getByText('10 caracteres ou mais').closest('[data-ok]')).toHaveAttribute('data-ok', 'true');
  });

  it('bloqueia confirmação diferente sem chamar a API', () => {
    renderPage();
    type('sua senha de hoje', 'Atual#123');
    type('mínimo 10 caracteres', 'Senha#Forte2026');
    type('repita a nova senha', 'Senha#Forte2027');
    fireEvent.click(screen.getByRole('button', {name: 'Salvar nova senha'}));

    expect(toastError).toHaveBeenCalledWith('As senhas não coincidem', expect.any(String));
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('envia oldPassword/newPassword e limpa o formulário no sucesso', async () => {
    renderPage();
    type('sua senha de hoje', 'Atual#123');
    type('mínimo 10 caracteres', 'Senha#Forte2026');
    type('repita a nova senha', 'Senha#Forte2026');
    fireEvent.click(screen.getByRole('button', {name: 'Salvar nova senha'}));

    await waitFor(() =>
      expect(authService.changePassword).toHaveBeenCalledWith({oldPassword: 'Atual#123', newPassword: 'Senha#Forte2026'}),
    );
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Senha alterada', expect.any(String)));
    expect(screen.getByPlaceholderText('sua senha de hoje')).toHaveValue('');
  });

  it('explica quando a conta (Google) não tem senha local', async () => {
    mocked(authService.changePassword).mockRejectedValue(
      new AxiosError('fail', '500', undefined, undefined, {
        status: 500,
        statusText: 'err',
        headers: {},
        config: {headers: new AxiosHeaders()},
        data: {message: 'Senha não configurada para este usuário'},
      }),
    );
    renderPage();
    type('sua senha de hoje', 'qualquer');
    type('mínimo 10 caracteres', 'Senha#Forte2026');
    type('repita a nova senha', 'Senha#Forte2026');
    fireEvent.click(screen.getByRole('button', {name: 'Salvar nova senha'}));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Sua conta não tem senha', expect.any(String)));
  });

  it('setup → verify ativa o 2FA e troca o badge', async () => {
    renderPage();
    await screen.findByAltText('QR code para configurar o app autenticador');
    expect(twoFactorService.setup).toHaveBeenCalledTimes(1);

    mocked(Profile.getProfile).mockResolvedValue({id: 'u1', twoFactorEnabled: true});
    fireEvent.change(screen.getByLabelText('Código de 6 dígitos do app autenticador'), {target: {value: '12a3456'}});
    fireEvent.click(screen.getByRole('button', {name: 'Ativar 2FA'}));

    await waitFor(() => expect(twoFactorService.verify).toHaveBeenCalledWith('123456'));
    await waitFor(() => expect(screen.getByTestId('two-factor-badge')).toHaveTextContent('Ativa'));
    expect(toastSuccess).toHaveBeenCalledWith('2FA ativada', expect.any(String));
    expect(await screen.findByText('Códigos de recuperação')).toBeInTheDocument();
  });

  it('com 2FA ativo não chama o setup (que desligaria o 2FA no server)', async () => {
    mocked(Profile.getProfile).mockResolvedValue({id: 'u1', twoFactorEnabled: true});
    renderPage();
    await waitFor(() => expect(screen.getByTestId('two-factor-badge')).toHaveTextContent('Ativa'));
    expect(twoFactorService.setup).not.toHaveBeenCalled();
    expect(screen.getByRole('button', {name: 'Desativar 2FA'})).toBeInTheDocument();
  });
});
