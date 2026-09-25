import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {PixCheckoutModal} from './PixCheckoutModal';

const checkout = vi.fn();
const getCharge = vi.fn();
const toastSuccess = vi.fn();

vi.mock('@/services/pix', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/services/pix')>();
  return {
    ...original,
    default: {
      checkout: (...args: unknown[]) => checkout(...args),
      getCharge: (...args: unknown[]) => getCharge(...args),
      isAvailable: vi.fn(),
    },
  };
});

vi.mock('@/hooks/use-app-toast', () => ({
  default: () => ({success: toastSuccess, error: vi.fn(), info: vi.fn()}),
}));

const pending = {
  chargeId: 'c1',
  status: 'pending',
  amount: 14.9,
  interval: 'month',
  qrCodePayload: '00020126copia',
  qrCodeImage: 'iVBORw0KGgo',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

const plan = {id: 'plan-pro', name: 'Pro'};

function renderModal(overrides: Partial<Parameters<typeof PixCheckoutModal>[0]> = {}) {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}, mutations: {retry: false}}});
  const onManageSubscription = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <PixCheckoutModal
        open
        onOpenChange={vi.fn()}
        plan={plan}
        interval="month"
        onManageSubscription={onManageSubscription}
        {...overrides}
      />
    </QueryClientProvider>,
  );
  return {onManageSubscription};
}

describe('PixCheckoutModal (TRA-195)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCharge.mockResolvedValue(pending);
  });

  it('abre emitindo a cobrança e mostra QR, valor e contagem', async () => {
    checkout.mockResolvedValue(pending);
    renderModal();

    expect(await screen.findByAltText('QR code PIX para pagamento')).toHaveAttribute(
      'src',
      'data:image/png;base64,iVBORw0KGgo',
    );
    expect(checkout).toHaveBeenCalledWith('plan-pro', 'month', undefined);
    expect(screen.getByText('R$ 14,90'.replace(' ', ' '))).toBeInTheDocument();
    expect(screen.getByText('Aguardando pagamento…')).toBeInTheDocument();
    expect(screen.getByText(/expira em/)).toBeInTheDocument();
  });

  it('copia o código PIX', async () => {
    checkout.mockResolvedValue(pending);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {clipboard: {writeText}});
    renderModal();

    fireEvent.click(await screen.findByRole('button', {name: /Copiar código PIX/}));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('00020126copia'));
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('CPF exigido: pede o CPF com máscara e reenvia com ele', async () => {
    checkout
      .mockRejectedValueOnce({response: {status: 400, data: {error: 'PIX_CPF_REQUIRED', message: 'Informe'}}})
      .mockResolvedValueOnce(pending);
    renderModal();

    const input = await screen.findByLabelText('CPF');
    const submit = screen.getByRole('button', {name: 'Gerar QR code'});
    expect(submit).toBeDisabled();

    fireEvent.change(input, {target: {value: '52998224725'}});
    expect(input).toHaveValue('529.982.247-25');
    fireEvent.click(screen.getByRole('button', {name: 'Gerar QR code'}));

    await waitFor(() => expect(checkout).toHaveBeenLastCalledWith('plan-pro', 'month', '529.982.247-25'));
    expect(await screen.findByAltText('QR code PIX para pagamento')).toBeInTheDocument();
  });

  it('polling confirma o pagamento e mostra até quando o plano vale', async () => {
    checkout.mockResolvedValue(pending);
    getCharge.mockResolvedValue({...pending, status: 'paid', periodEnd: '2026-10-24T15:00:00.000Z'});
    renderModal();

    expect(await screen.findByText('Pagamento confirmado', {}, {timeout: 8000})).toBeInTheDocument();
    expect(screen.getByText(/liberado até 24 de outubro de 2026/)).toBeInTheDocument();
  }, 10000);

  it('cartão ativo (409): oferece gerenciar a assinatura', async () => {
    checkout.mockRejectedValue({response: {status: 409, data: {message: 'Você já tem uma assinatura ativa no cartão.'}}});
    const {onManageSubscription} = renderModal();

    fireEvent.click(await screen.findByRole('button', {name: 'Gerenciar assinatura'}));
    expect(onManageSubscription).toHaveBeenCalled();
  });

  it('QR vencido: nada foi cobrado e dá para gerar outro', async () => {
    checkout.mockResolvedValueOnce({...pending, expiresAt: new Date(Date.now() - 1000).toISOString()});
    checkout.mockResolvedValueOnce(pending);
    renderModal();

    fireEvent.click(await screen.findByRole('button', {name: 'Gerar novo QR code'}));
    await waitFor(() => expect(checkout).toHaveBeenCalledTimes(2));
  });
});
