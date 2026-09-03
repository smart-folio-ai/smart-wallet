import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import AdminGrants from './AdminGrants';
import AdminService from '@/services/admin';
import {useAuth} from '@/hooks/useAuth';

vi.mock('@/services/admin');
vi.mock('@/hooks/useAuth');

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AdminGrants />
    </QueryClientProvider>,
  );

  const byId = <T extends HTMLElement = HTMLElement>(id: string) =>
    utils.container.querySelector<T>(`#${id}`)!;

  return {...utils, byId};
}

const emptyHistory = {items: [], page: 1, limit: 10, total: 0};

describe('AdminGrants — concessão manual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({isAdmin: true});
    (AdminService.getPlans as any).mockResolvedValue([
      {_id: 'plan-1', name: 'Pro', isActive: true},
    ]);
    (AdminService.listGrants as any).mockResolvedValue(emptyHistory);
    (AdminService.grantSubscription as any).mockResolvedValue({
      message: 'Concessão manual aplicada com sucesso',
    });
  });

  it('sends a custom trialDurationDays and discountPercent for TRIAL grants', async () => {
    const {byId} = renderPage();

    fireEvent.change(byId('grant-email'), {
      target: {value: 'user@example.com'},
    });
    await waitFor(() =>
      expect(screen.getByRole('option', {name: 'Pro'})).toBeInTheDocument(),
    );
    fireEvent.change(byId('grant-plan'), {
      target: {value: 'plan-1'},
    });
    fireEvent.change(byId('grant-trial-duration'), {
      target: {value: '14'},
    });
    fireEvent.change(byId('grant-discount'), {
      target: {value: '25'},
    });

    fireEvent.click(screen.getByRole('button', {name: /Confirmar concessão/i}));

    await waitFor(() => {
      expect(AdminService.grantSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          planId: 'plan-1',
          grantType: 'TRIAL',
          trialDurationDays: 14,
          discountPercent: 25,
        }),
      );
    });
  });

  it('omits trialDurationDays and discountPercent for PERMANENT grants without a discount', async () => {
    const {byId} = renderPage();

    fireEvent.change(byId('grant-email'), {
      target: {value: 'user@example.com'},
    });
    await waitFor(() =>
      expect(screen.getByRole('option', {name: 'Pro'})).toBeInTheDocument(),
    );
    fireEvent.change(byId('grant-plan'), {
      target: {value: 'plan-1'},
    });
    fireEvent.change(byId('grant-type'), {
      target: {value: 'PERMANENT'},
    });

    fireEvent.click(screen.getByRole('button', {name: /Confirmar concessão/i}));

    await waitFor(() => {
      expect(AdminService.grantSubscription).toHaveBeenCalled();
    });
    const payload = (AdminService.grantSubscription as any).mock.calls[0][0];
    expect(payload.trialDurationDays).toBeUndefined();
    expect(payload.discountPercent).toBeUndefined();
    expect(payload.grantType).toBe('PERMANENT');
  });

  it('blocks submission when trial duration is not a positive integer', async () => {
    const {byId} = renderPage();

    fireEvent.change(byId('grant-email'), {
      target: {value: 'user@example.com'},
    });
    await waitFor(() =>
      expect(screen.getByRole('option', {name: 'Pro'})).toBeInTheDocument(),
    );
    fireEvent.change(byId('grant-plan'), {
      target: {value: 'plan-1'},
    });
    fireEvent.change(byId('grant-trial-duration'), {
      target: {value: '0'},
    });

    fireEvent.click(screen.getByRole('button', {name: /Confirmar concessão/i}));

    expect(AdminService.grantSubscription).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Informe um número de dias maior que zero/i),
    ).toBeInTheDocument();
  });

  it('blocks submission when discount is out of the 0-100 range', async () => {
    const {byId} = renderPage();

    fireEvent.change(byId('grant-email'), {
      target: {value: 'user@example.com'},
    });
    await waitFor(() =>
      expect(screen.getByRole('option', {name: 'Pro'})).toBeInTheDocument(),
    );
    fireEvent.change(byId('grant-plan'), {
      target: {value: 'plan-1'},
    });
    fireEvent.change(byId('grant-discount'), {
      target: {value: '150'},
    });

    fireEvent.click(screen.getByRole('button', {name: /Confirmar concessão/i}));

    expect(AdminService.grantSubscription).not.toHaveBeenCalled();
    expect(screen.getByText(/Informe um valor entre 0 e 100/i)).toBeInTheDocument();
  });

  it('renders the manual grant history table', async () => {
    (AdminService.listGrants as any).mockResolvedValue({
      items: [
        {
          id: 'grant-1',
          userEmail: 'user@example.com',
          planId: 'plan-1',
          planName: 'Pro',
          grantType: 'TRIAL',
          trialDurationDays: 14,
          discountPercent: 10,
          performedByEmail: 'admin@example.com',
          createdAt: '2026-01-01T12:00:00.000Z',
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
    });

    renderPage();

    expect(await screen.findByText('user@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Pro').length).toBeGreaterThan(0);
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });
});
