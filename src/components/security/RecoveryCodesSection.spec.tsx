import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import RecoveryCodesSection from './RecoveryCodesSection';
import {LOW_RECOVERY_CODES_THRESHOLD} from '@/hooks/useRecoveryCodes';
import {RecoveryCodesStatus} from '@/interface/two-factor';

const getStatus = vi.fn();
const generate = vi.fn();

vi.mock('@/services/two-factor/recovery-codes', async () => {
  const actual = await vi.importActual<
    typeof import('@/services/two-factor/recovery-codes')
  >('@/services/two-factor/recovery-codes');
  return {
    ...actual,
    recoveryCodesService: {
      getStatus: (...args: unknown[]) => getStatus(...args),
      generate: (...args: unknown[]) => generate(...args),
      consume: vi.fn(),
    },
  };
});

vi.mock('@/hooks/use-app-toast', () => ({
  default: () => ({success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn()}),
  useAppToast: () => ({success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn()}),
}));

const renderSection = (enabled = true) => {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RecoveryCodesSection twoFactorEnabled={enabled} />
    </QueryClientProvider>,
  );
};

const status = (overrides: Partial<RecoveryCodesStatus> = {}): RecoveryCodesStatus => ({
  total: 10,
  remaining: 10,
  generatedAt: '2026-09-01T10:00:00.000Z',
  ...overrides,
});

describe('RecoveryCodesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não consulta nada quando o 2FA está desligado', () => {
    renderSection(false);
    expect(getStatus).not.toHaveBeenCalled();
  });

  it('mostra restantes de total sem alarme quando há folga', async () => {
    getStatus.mockResolvedValue(status({remaining: 8}));
    renderSection();

    expect(await screen.findByTestId('recovery-codes-count')).toHaveTextContent(
      '8 de 10',
    );
    expect(screen.queryByText(/restam poucos códigos/i)).not.toBeInTheDocument();
  });

  it('avisa exatamente no limiar de poucos códigos', async () => {
    getStatus.mockResolvedValue(status({remaining: LOW_RECOVERY_CODES_THRESHOLD}));
    renderSection();

    expect(await screen.findByText(/restam poucos códigos/i)).toBeInTheDocument();
  });

  it('não avisa um código acima do limiar', async () => {
    getStatus.mockResolvedValue(
      status({remaining: LOW_RECOVERY_CODES_THRESHOLD + 1}),
    );
    renderSection();

    await screen.findByTestId('recovery-codes-count');
    expect(screen.queryByText(/restam poucos códigos/i)).not.toBeInTheDocument();
  });

  it('pede geração quando o usuário nunca gerou códigos', async () => {
    getStatus.mockResolvedValue(status({remaining: 0, total: 0, generatedAt: null}));
    renderSection();

    expect(
      await screen.findByText(/ainda não tem códigos de recuperação/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /gerar códigos de recuperação/i}),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('recovery-codes-count')).not.toBeInTheDocument();
  });

  it('gera com TOTP, avisa que a lista antiga morre e abre a tela de exibição única', async () => {
    getStatus.mockResolvedValue(status({remaining: 2}));
    generate.mockResolvedValue({
      codes: ['A1B2-C3D4', 'E5F6-G7H8'],
      generatedAt: '2026-09-07T12:00:00.000Z',
    });
    renderSection();

    await userEvent.click(
      await screen.findByRole('button', {name: /gerar novos códigos/i}),
    );
    expect(
      screen.getByText(/códigos atuais deixarão de funcionar/i),
    ).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/código do autenticador/i), '123456');
    await userEvent.click(screen.getByRole('button', {name: /confirmar e gerar/i}));

    await waitFor(() => expect(generate).toHaveBeenCalledWith('123456'));
    expect(await screen.findByText('A1B2-C3D4')).toBeInTheDocument();
    expect(
      screen.getByText(/única vez que mostramos estes códigos/i),
    ).toBeInTheDocument();
  });

  it('mostra o erro honesto quando o TOTP está errado', async () => {
    const {RecoveryCodesError} = await import('@/services/two-factor/recovery-codes');
    getStatus.mockResolvedValue(status({remaining: 5}));
    generate.mockRejectedValue(
      new RecoveryCodesError(
        'invalid-totp',
        'Código do autenticador inválido',
        'Confira os 6 dígitos no app — o código muda a cada 30 segundos.',
      ),
    );
    renderSection();

    await userEvent.click(
      await screen.findByRole('button', {name: /gerar novos códigos/i}),
    );
    await userEvent.type(screen.getByLabelText(/código do autenticador/i), '000000');
    await userEvent.click(screen.getByRole('button', {name: /confirmar e gerar/i}));

    expect(
      await screen.findByText(/código do autenticador inválido/i),
    ).toBeInTheDocument();
  });
});
