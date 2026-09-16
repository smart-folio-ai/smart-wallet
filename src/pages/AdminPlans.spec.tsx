import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import AdminPlans from './AdminPlans';
import AdminService from '@/services/admin';

vi.mock('@/services/admin');

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminPlans />
    </QueryClientProvider>,
  );
}

// Nível de acesso (TRA-182) é um número livre, não um select — sem lista
// fixa de nomes.
function setAccessLevel(level: number) {
  fireEvent.change(screen.getByLabelText(/Nível de acesso/i), {
    target: {value: String(level)},
  });
}

describe('AdminPlans — plan presentation flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
      configurable: true,
      value: () => false,
    });
    Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
      configurable: true,
      value: () => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
      configurable: true,
      value: () => undefined,
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: () => undefined,
    });
    (AdminService.getPlans as any).mockResolvedValue([]);
    (AdminService.createPlan as any).mockResolvedValue({});
    (AdminService.getWebhookStatus as any).mockResolvedValue({configured: true});
    (AdminService.getWebhookEvents as any).mockResolvedValue([]);
  });

  it('sends isFeatured and isComingSoon when the checkboxes are checked', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/^Nome$/i), {
      target: {value: 'Plano Novo'},
    });
    fireEvent.change(screen.getByLabelText(/^Preço$/i), {
      target: {value: '49.9'},
    });

    fireEvent.click(screen.getByLabelText(/Destacar na landing/i));
    fireEvent.click(screen.getByLabelText(/Exibir como "em breve"/i));
    setAccessLevel(10);

    fireEvent.click(screen.getByRole('button', {name: /Criar plano/i}));

    await waitFor(() => {
      expect(AdminService.createPlan).toHaveBeenCalledWith(
        expect.objectContaining({isFeatured: true, isComingSoon: true, accessLevel: 10}),
      );
    });
  });

  it('sends annualPrice and annualStripePriceId when filled in', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/^Nome$/i), {
      target: {value: 'Plano Anual'},
    });
    fireEvent.change(screen.getByLabelText(/^Preço$/i), {
      target: {value: '49.9'},
    });
    fireEvent.change(screen.getByLabelText(/Preço anual/i), {
      target: {value: '499'},
    });
    fireEvent.change(screen.getByLabelText(/Stripe Price ID anual/i), {
      target: {value: 'price_annual_123'},
    });
    setAccessLevel(20);

    fireEvent.click(screen.getByRole('button', {name: /Criar plano/i}));

    await waitFor(() => {
      expect(AdminService.createPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          annualPrice: 499,
          annualStripePriceId: 'price_annual_123',
        }),
      );
    });
  });

  it('omite annualPrice e annualStripePriceId quando os campos ficam vazios', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/^Nome$/i), {
      target: {value: 'Plano Sem Anual'},
    });
    fireEvent.change(screen.getByLabelText(/^Preço$/i), {
      target: {value: '19.9'},
    });
    setAccessLevel(0);

    fireEvent.click(screen.getByRole('button', {name: /Criar plano/i}));

    await waitFor(() => {
      expect(AdminService.createPlan).toHaveBeenCalled();
    });
    const payload = (AdminService.createPlan as any).mock.calls[0][0];
    expect(payload).not.toHaveProperty('annualPrice');
    expect(payload).not.toHaveProperty('annualStripePriceId');
  });

  it('sends both flags as false when the checkboxes are untouched', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/^Nome$/i), {
      target: {value: 'Plano Simples'},
    });
    fireEvent.change(screen.getByLabelText(/^Preço$/i), {
      target: {value: '19.9'},
    });
    setAccessLevel(0);

    fireEvent.click(screen.getByRole('button', {name: /Criar plano/i}));

    await waitFor(() => {
      expect(AdminService.createPlan).toHaveBeenCalledWith(
        expect.objectContaining({isFeatured: false, isComingSoon: false}),
      );
    });
  });

  it('blocks submission without selecting an access tier', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/^Nome$/i), {
      target: {value: 'Plano Sem Tier'},
    });
    fireEvent.change(screen.getByLabelText(/^Preço$/i), {
      target: {value: '19.9'},
    });

    fireEvent.click(screen.getByRole('button', {name: /Criar plano/i}));

    await waitFor(() => {
      expect(screen.getByRole('button', {name: /Criar plano/i})).toBeEnabled();
    });
    expect(AdminService.createPlan).not.toHaveBeenCalled();
  });
});
