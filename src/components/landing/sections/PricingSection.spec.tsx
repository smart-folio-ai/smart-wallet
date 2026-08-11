import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {PricingSection} from './PricingSection';
import SubscriptionService from '@/services/subscription';

vi.mock('@/services/subscription');

const mockPlans = [
  {
    _id: 'plan_pro',
    name: 'Investidor Pro',
    description: 'Para quem já tem carteira formada',
    price: 49,
    annualPrice: 399,
    currency: 'BRL',
    interval: 'month',
    intervalCount: 1,
    stripePriceId: 'price_1',
    stripeProductId: 'prod_1',
    isActive: true,
    features: ['Ativos ilimitados', 'Alertas de risco com IA'],
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'plan_global',
    name: 'Global Investor',
    description: 'Para operação maior',
    price: 199,
    currency: 'BRL',
    interval: 'month',
    intervalCount: 1,
    stripePriceId: 'price_2',
    stripeProductId: 'prod_2',
    isActive: true,
    features: ['Tudo do Pro', 'Multiportfólio'],
    createdAt: '',
    updatedAt: '',
  },
];

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PricingSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (SubscriptionService.getPlans as any).mockResolvedValue(mockPlans);
  });

  it('ancora em #planos e mostra o plano Básico gratuito sempre, mesmo antes de carregar', () => {
    const {container} = renderSection();
    expect(container.querySelector('#planos')).not.toBeNull();
    expect(screen.getByText('Básico')).toBeInTheDocument();
  });

  it('mostra os planos pagos reais vindos da API', async () => {
    renderSection();
    await waitFor(() => {
      expect(screen.getByText('Investidor Pro')).toBeInTheDocument();
      expect(screen.getByText('Global Investor')).toBeInTheDocument();
    });
  });

  it('mantém o CTA do plano Básico como link direto para /register', () => {
    renderSection();
    const basicoCta = screen.getByRole('link', {name: /começar grátis/i});
    expect(basicoCta).toHaveAttribute('href', '/register');
  });

  it('abre o modal de captura ao clicar no CTA de um plano pago, em vez de navegar', async () => {
    renderSection();
    await waitFor(() => screen.getByText('Investidor Pro'));

    const proCta = screen.getByRole('button', {name: 'Assinar Investidor Pro'});
    fireEvent.click(proCta);

    expect(screen.getByText(/Quero o plano Investidor Pro/i)).toBeInTheDocument();
  });

  it('não quebra a renderização quando a API de planos falha, e mostra um estado de erro distinto para os planos pagos', async () => {
    (SubscriptionService.getPlans as any).mockRejectedValue(new Error('network error'));
    const {container} = renderSection();

    expect(container.querySelector('#planos')).not.toBeNull();
    expect(screen.getByText('Básico')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('pricing-plans-error')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', {name: /tentar novamente/i}),
    ).toBeInTheDocument();
    expect(screen.queryByText('Investidor Pro')).not.toBeInTheDocument();
  });

  it('mostra um estado de carregamento para os planos pagos enquanto a API não responde', () => {
    (SubscriptionService.getPlans as any).mockImplementation(
      () => new Promise(() => {}),
    );
    renderSection();

    expect(screen.getByText('Básico')).toBeInTheDocument();
    expect(screen.getByTestId('pricing-plans-loading')).toBeInTheDocument();
    expect(screen.getByText(/carregando planos/i)).toBeInTheDocument();
  });
});
