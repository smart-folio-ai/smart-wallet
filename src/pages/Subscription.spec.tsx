import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor, fireEvent, within} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Subscription from './Subscription';
import SubscriptionService from '@/services/subscription';
import Profile from '@/services/profile';

vi.mock('@/services/subscription');
vi.mock('@/services/profile');
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
      <Subscription />
    </QueryClientProvider>,
  );

const column = (name: string) => screen.getAllByTestId('plan-column').find((el) => el.textContent?.includes(name))!;

describe('Subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
    vi.mocked(Profile.getProfile).mockResolvedValue({_id: 'user_1'} as never);
    vi.mocked(SubscriptionService.getPlans).mockResolvedValue(PLANS as never);
    vi.mocked(SubscriptionService.getCurrentPlan).mockResolvedValue({hasSubscription: false, plan: null} as never);
    vi.mocked(SubscriptionService.getInvoices).mockResolvedValue([]);
  });

  it('compares real plans sorted by price with a feature matrix', async () => {
    renderPage();

    await waitFor(() => expect(screen.getAllByTestId('plan-column')).toHaveLength(4));
    expect(screen.getAllByTestId('plan-column').map((el) => el.textContent)).toEqual([
      expect.stringContaining('Essencial'),
      expect.stringContaining('Pro'),
      expect.stringContaining('Wealth Premium'),
      expect.stringContaining('Global Investor'),
    ]);
    expect(within(column('Pro')).getByText('Popular')).toBeInTheDocument();
    expect(within(column('Global Investor')).getByText('Em breve')).toBeInTheDocument();
    const row = screen.getAllByText('Módulo fiscal com DARF').map((el) => el.closest('tr')).find(Boolean)!;
    // Cumulativo: Pro lista, e Wealth e Global herdam — Essencial não.
    expect(within(row).getAllByText('✓')).toHaveLength(3);
    const essencialOnly = screen.getAllByText('Alocação e proventos').map((el) => el.closest('tr')).find(Boolean)!;
    expect(within(essencialOnly).getAllByText('✓')).toHaveLength(4);
  });

  it('shows one card per plan with cumulative benefits', async () => {
    renderPage();

    await waitFor(() => expect(screen.getAllByTestId('plan-card')).toHaveLength(4));
    const card = (name: string) => screen.getAllByTestId('plan-card').find((el) => el.textContent?.includes(name))!;
    const wealth = card('Wealth Premium');
    expect(within(wealth).getByText('Alocação e proventos')).toBeInTheDocument();
    expect(within(wealth).getByText('Relatórios exportáveis')).toBeInTheDocument();
    expect(within(wealth).getByText('R$ 24,90')).toBeInTheDocument();
    expect(within(card('Essencial')).getByText('Plano atual')).toBeInTheDocument();
    expect(within(card('Pro')).getByRole('button', {name: 'Assinar Pro'})).toBeInTheDocument();
  });

  it('shows the real annual price only when Stripe has one, with the real discount', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByTestId('plan-column')).toHaveLength(4));
    fireEvent.click(screen.getByRole('button', {name: 'Anual'}));

    expect(within(column('Pro')).getByText(/149,00\/ano/)).toBeInTheDocument();
    // Sem preço anual real: continua mensal, nunca desconto inventado.
    expect(within(column('Wealth Premium')).getByText(/24,90\/mês/)).toBeInTheDocument();
    expect(screen.getByText('Economize 17%')).toBeInTheDocument();
  });

  it('starts checkout for the token user with the chosen billing interval', async () => {
    vi.mocked(SubscriptionService.createCheckoutSession).mockResolvedValue({url: 'https://checkout.stripe.com/x'});
    renderPage();
    await waitFor(() => expect(screen.getAllByTestId('plan-column')).toHaveLength(4));
    fireEvent.click(screen.getByRole('button', {name: 'Anual'}));
    fireEvent.click(screen.getAllByRole('button', {name: 'Assinar Pro'})[0]);

    await waitFor(() =>
      expect(SubscriptionService.createCheckoutSession).toHaveBeenCalledWith('pro', 'user_1', expect.any(String), expect.any(String), 'annual'),
    );
    await waitFor(() => expect(window.location.href).toBe('https://checkout.stripe.com/x'));
  });

  it('marks the current plan, opens the billing portal and lists invoices', async () => {
    vi.mocked(SubscriptionService.getCurrentPlan).mockResolvedValue({
      hasSubscription: true,
      plan: PLANS[0],
      subscription: {status: 'active', currentPeriodEnd: '2026-10-14T12:00:00Z', cancelAtPeriodEnd: false},
    } as never);
    vi.mocked(SubscriptionService.getInvoices).mockResolvedValue([
      {id: 'in_1', number: 'A-1', status: 'paid', description: 'Pro · mensal', total: 14.9, currency: 'brl', createdAt: '2026-09-14T12:00:00Z', dueDate: null, paidAt: '2026-09-14T12:00:00Z', pdfUrl: 'https://stripe/pdf'},
    ]);
    vi.mocked(SubscriptionService.createPortalSession).mockResolvedValue({url: 'https://billing.stripe.com/p'});
    renderPage();

    expect(await screen.findByRole('heading', {name: 'Pro'})).toBeInTheDocument();
    expect(screen.getByText(/Renovação em 14 de outubro de 2026/)).toBeInTheDocument();
    const invoice = await screen.findByTestId('invoice');
    expect(within(invoice).getByText('Pago')).toBeInTheDocument();
    expect(within(invoice).getByRole('link', {name: 'Pro · mensal'})).toHaveAttribute('href', 'https://stripe/pdf');

    fireEvent.click(screen.getByRole('button', {name: 'Gerenciar assinatura'}));
    await waitFor(() => expect(window.location.href).toBe('https://billing.stripe.com/p'));
  });
});
