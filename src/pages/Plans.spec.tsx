import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor, fireEvent, within} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import Plans from './Plans';
import SubscriptionService from '@/services/subscription';
import Profile from '@/services/profile';
import PixPaymentService from '@/services/pix';

vi.mock('@/services/subscription');
vi.mock('@/services/profile');
vi.mock('@/services/pix');
const toast = {success: vi.fn(), error: vi.fn(), info: vi.fn()};
vi.mock('@/hooks/use-app-toast', () => ({default: () => toast}));

Object.defineProperty(window, 'location', {value: {href: ''}, writable: true});

const plan = (overrides: Record<string, unknown>) => ({
  _id: 'p',
  name: 'Plano',
  description: '',
  price: 0,
  currency: 'brl',
  interval: 'month',
  intervalCount: 1,
  stripePriceId: '',
  stripeProductId: '',
  isActive: true,
  features: [],
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const PLANS = [
  plan({_id: 'pro', name: 'Pro', price: 14.9, annualPrice: 149, isFeatured: true, features: ['Módulo fiscal com DARF', 'Relatórios exportáveis']}),
  plan({_id: 'free', name: 'Essencial', price: 0, features: ['Alocação e proventos']}),
  plan({_id: 'wealth', name: 'Wealth Premium', price: 24.9, features: ['Módulo fiscal com DARF']}),
  plan({_id: 'soon', name: 'Global Investor', price: 99, isActive: false, isComingSoon: true, features: []}),
];

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const card = (name: string) => screen.getAllByTestId('plan-card').find((el) => el.textContent?.includes(name))!;

describe('Plans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
    vi.mocked(Profile.getProfile).mockResolvedValue({_id: 'user_1'} as never);
    vi.mocked(SubscriptionService.getPlans).mockResolvedValue(PLANS as never);
    vi.mocked(SubscriptionService.getCurrentPlan).mockResolvedValue({hasSubscription: false, plan: null} as never);
    vi.mocked(PixPaymentService.isAvailable).mockResolvedValue(false);
  });

  it('shows one card per plan, sorted by price, with cumulative benefits', async () => {
    renderPage();

    await waitFor(() => expect(screen.getAllByTestId('plan-card')).toHaveLength(4));
    expect(screen.getAllByTestId('plan-card').map((el) => el.textContent)).toEqual([
      expect.stringContaining('Essencial'),
      expect.stringContaining('Pro'),
      expect.stringContaining('Wealth Premium'),
      expect.stringContaining('Global Investor'),
    ]);
    const wealth = card('Wealth Premium');
    expect(within(wealth).getByText('Alocação e proventos')).toBeInTheDocument();
    expect(within(wealth).getByText('Relatórios exportáveis')).toBeInTheDocument();
    expect(within(wealth).getByText('R$ 24,90')).toBeInTheDocument();
    expect(within(card('Essencial')).getByText('Plano atual')).toBeInTheDocument();
    expect(within(card('Pro')).getByText('Mais assinado')).toBeInTheDocument();
  });

  it('shows the annual price and its monthly equivalent when Stripe has one', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByTestId('plan-card')).toHaveLength(4));
    fireEvent.click(screen.getByRole('button', {name: 'Anual'}));

    expect(within(card('Pro')).getByText('R$ 149,00')).toBeInTheDocument();
    expect(within(card('Pro')).getByText('/ano')).toBeInTheDocument();
    expect(within(card('Pro')).getByText(/equivale a R\$ 12,42\/mês/)).toBeInTheDocument();
    // Sem preço anual real: continua mensal.
    expect(within(card('Wealth Premium')).getByText('/mês')).toBeInTheDocument();
  });

  it('opens the Stripe checkout for the chosen plan and interval', async () => {
    vi.mocked(SubscriptionService.createCheckoutSession).mockResolvedValue({url: 'https://checkout.stripe.com/x'});
    renderPage();
    await waitFor(() => expect(screen.getAllByTestId('plan-card')).toHaveLength(4));
    fireEvent.click(screen.getByRole('button', {name: 'Anual'}));
    fireEvent.click(within(card('Pro')).getByRole('button', {name: 'Assinar Pro'}));

    await waitFor(() =>
      expect(SubscriptionService.createCheckoutSession).toHaveBeenCalledWith('pro', 'user_1', expect.any(String), expect.any(String), 'annual'),
    );
    await waitFor(() => expect(window.location.href).toBe('https://checkout.stripe.com/x'));
  });

  it('shows the server reason when checkout fails', async () => {
    vi.mocked(SubscriptionService.createCheckoutSession).mockRejectedValue({
      response: {status: 400, data: {message: 'Plano sem preço configurado no Stripe. Contate o suporte.'}},
    });
    renderPage();
    await waitFor(() => expect(screen.getAllByTestId('plan-card')).toHaveLength(4));
    fireEvent.click(within(card('Pro')).getByRole('button', {name: 'Assinar Pro'}));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Não foi possível iniciar o checkout', 'Plano sem preço configurado no Stripe. Contate o suporte.'),
    );
  });

  it('offers PIX only when the server can charge it', async () => {
    vi.mocked(PixPaymentService.isAvailable).mockResolvedValue(true);
    renderPage();

    await waitFor(() => expect(within(card('Pro')).getByRole('button', {name: 'ou pagar com PIX'})).toBeInTheDocument());
    expect(within(card('Essencial')).queryByRole('button', {name: 'ou pagar com PIX'})).not.toBeInTheDocument();
  });
});
