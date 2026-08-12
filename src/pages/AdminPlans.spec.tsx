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

describe('AdminPlans — plan presentation flags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    fireEvent.click(screen.getByRole('button', {name: /Criar plano/i}));

    await waitFor(() => {
      expect(AdminService.createPlan).toHaveBeenCalledWith(
        expect.objectContaining({isFeatured: true, isComingSoon: true}),
      );
    });
  });

  it('sends both flags as false when the checkboxes are untouched', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/^Nome$/i), {
      target: {value: 'Plano Simples'},
    });
    fireEvent.change(screen.getByLabelText(/^Preço$/i), {
      target: {value: '19.9'},
    });

    fireEvent.click(screen.getByRole('button', {name: /Criar plano/i}));

    await waitFor(() => {
      expect(AdminService.createPlan).toHaveBeenCalledWith(
        expect.objectContaining({isFeatured: false, isComingSoon: false}),
      );
    });
  });
});
