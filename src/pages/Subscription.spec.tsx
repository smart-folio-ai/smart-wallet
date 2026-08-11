import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor, fireEvent} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Subscriptions from './Subscription';
import SubscriptionService from '@/services/subscription';
import Profile from '@/services/profile';

vi.mock('@/services/subscription');
vi.mock('@/services/profile');

Object.defineProperty(window, 'location', {
  value: {href: ''},
  writable: true,
});

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe('Subscription page — real annual pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
    (Profile.getProfile as any).mockResolvedValue({_id: 'user_1'});
    (SubscriptionService.getCurrentPlan as any).mockResolvedValue({
      plan: null,
    });
  });

  it('shows the real annual price when the backend provides one, not a computed 30% discount', async () => {
    (SubscriptionService.getPlans as any).mockResolvedValue([
      {
        _id: 'plan_1',
        name: 'Investidor Pro',
        description: 'desc',
        price: 49,
        annualPrice: 399,
        currency: 'BRL',
        interval: 'month',
        intervalCount: 1,
        stripePriceId: 'price_1',
        stripeProductId: 'prod_1',
        isActive: true,
        features: ['Feature A'],
        createdAt: '',
        updatedAt: '',
      },
    ]);

    renderWithQueryClient(<Subscriptions />);

    await waitFor(() => {
      expect(screen.getByText('Investidor Pro')).toBeInTheDocument();
    });

    // Switch to the annual pricing view via the SeletorPrice "Anual" button.
    fireEvent.click(screen.getByRole('button', {name: /Anual/i}));

    // The old buggy computation would have rendered 411,60 (49 * 12 * 0.7).
    // The real backend-provided annualPrice (399) must be shown instead.
    await waitFor(() => {
      expect(screen.getByText(/399,00/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/411,60/)).not.toBeInTheDocument();
  });

  it('sends the selected billing interval when starting checkout', async () => {
    (SubscriptionService.getPlans as any).mockResolvedValue([
      {
        _id: 'plan_1',
        name: 'Investidor Pro',
        description: 'desc',
        price: 49,
        annualPrice: 399,
        currency: 'BRL',
        interval: 'month',
        intervalCount: 1,
        stripePriceId: 'price_1',
        stripeProductId: 'prod_1',
        isActive: true,
        features: ['Feature A'],
        createdAt: '',
        updatedAt: '',
      },
    ]);
    (SubscriptionService.createCheckoutSession as any).mockResolvedValue({
      url: 'https://checkout.stripe.com/x',
    });

    renderWithQueryClient(<Subscriptions />);

    await waitFor(() => {
      expect(screen.getByText('Investidor Pro')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', {name: /Anual/i}));
    fireEvent.click(screen.getByRole('button', {name: /Assinar Agora/i}));

    await waitFor(() => {
      expect(SubscriptionService.createCheckoutSession).toHaveBeenCalledWith(
        'plan_1',
        'user_1',
        expect.any(String),
        expect.any(String),
        'annual',
      );
    });
  });

  it('renders the same price for Mensal and Anual when the plan has no real annual price', async () => {
    (SubscriptionService.getPlans as any).mockResolvedValue([
      {
        _id: 'plan_1',
        name: 'Investidor Pro',
        description: 'desc',
        price: 49,
        // annualPrice intentionally omitted — plan has no real annual price configured.
        currency: 'BRL',
        interval: 'month',
        intervalCount: 1,
        stripePriceId: 'price_1',
        stripeProductId: 'prod_1',
        isActive: true,
        features: ['Feature A'],
        createdAt: '',
        updatedAt: '',
      },
    ]);

    renderWithQueryClient(<Subscriptions />);

    await waitFor(() => {
      expect(screen.getByText('Investidor Pro')).toBeInTheDocument();
    });

    // Capture the Mensal (default) displayed price.
    const monthlyPriceMatch = screen.getByText(/49,00/);
    expect(monthlyPriceMatch).toBeInTheDocument();

    // Switch to the annual pricing view via the SeletorPrice "Anual" button.
    fireEvent.click(screen.getByRole('button', {name: /Anual/i}));

    // Without a real annualPrice, the fallback must show the SAME price
    // as Mensal — never a fabricated 30% discount (which would be 411,60).
    await waitFor(() => {
      expect(screen.getByText(/49,00/)).toBeInTheDocument();
    });
    expect(screen.queryByText(/411,60/)).not.toBeInTheDocument();
  });
});
