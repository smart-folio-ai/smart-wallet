import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Select de tier e o segundo combobox do formulario (o primeiro e Intervalo).
async function selectTier(optionName: RegExp | string) {
  const user = userEvent.setup();
  const comboboxes = screen.getAllByRole('combobox');
  await user.click(comboboxes[1]);
  await user.click(await screen.findByRole('option', {name: optionName}));
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
    await selectTier('Pro');

    fireEvent.click(screen.getByRole('button', {name: /Criar plano/i}));

    await waitFor(() => {
      expect(AdminService.createPlan).toHaveBeenCalledWith(
        expect.objectContaining({isFeatured: true, isComingSoon: true, tier: 'pro'}),
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
    await selectTier('Premium');

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
    await selectTier('Free');

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
    await selectTier('Free');

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
