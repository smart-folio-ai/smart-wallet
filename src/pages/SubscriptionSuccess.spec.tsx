import {describe, expect, it, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import SubscriptionSuccess from './SubscriptionSuccess';
import SubscriptionService from '@/services/subscription';

vi.mock('@/services/subscription');

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retryDelay: 0}}})}>
      <MemoryRouter initialEntries={['/subscription-success?session_id=cs_test_123']}>
        <SubscriptionSuccess />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('SubscriptionSuccess (TRA-218)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('com a assinatura ativa, confirma e mostra o plano', async () => {
    vi.mocked(SubscriptionService.getCurrentPlan).mockResolvedValue({
      hasSubscription: true,
      subscription: {status: 'active', currentPeriodEnd: '2026-10-26T00:00:00.000Z'},
      plan: {name: 'Pro', price: 19.9, currency: 'brl', interval: 'month', features: ['Comparador']},
    } as never);

    renderPage();

    expect(await screen.findByText('Assinatura Confirmada!')).toBeInTheDocument();
    expect(screen.getAllByText('Pro').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', {name: /Ver faturas/})).toBeInTheDocument();
  });

  it('antes do webhook, diz que está confirmando e não "confirmada"', async () => {
    vi.mocked(SubscriptionService.getCurrentPlan).mockResolvedValue({hasSubscription: false, subscription: null, plan: null} as never);

    renderPage();

    await waitFor(() => expect(screen.getByTestId('subscription-confirmation')).toHaveAttribute('data-state', 'pending'));
    expect(screen.queryByText('Assinatura Confirmada!')).not.toBeInTheDocument();
  });

  it('se a consulta falha, mostra erro com caminho para Assinatura', async () => {
    vi.mocked(SubscriptionService.getCurrentPlan).mockRejectedValue(new Error('503'));

    renderPage();

    await waitFor(() => expect(screen.getByTestId('subscription-confirmation')).toHaveAttribute('data-state', 'error'));
    expect(screen.queryByText('Assinatura Confirmada!')).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Ver minha assinatura'})).toBeInTheDocument();
  });
});
