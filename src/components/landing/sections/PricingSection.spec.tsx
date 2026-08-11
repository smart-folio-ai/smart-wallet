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
    name: 'Pro',
    description: 'Para investidores iniciantes',
    price: 14.9,
    currency: 'brl',
    interval: 'month',
    intervalCount: 1,
    stripePriceId: 'price_2',
    stripeProductId: 'prod_2',
    isActive: true,
    isFeatured: true,
    features: ['Ativos ilimitados', 'Alertas de risco com IA'],
    createdAt: '',
    updatedAt: '',
  },
  {
    _id: 'plan_free',
    name: 'Free',
    description: 'Para quem está começando',
    price: 0,
    currency: 'brl',
    interval: 'month',
    intervalCount: 1,
    stripePriceId: 'price_1',
    stripeProductId: 'prod_1',
    isActive: true,
    features: ['Até 10 ativos', 'Consolidação de corretoras'],
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

  it('mantém a âncora #planos e o cabeçalho mesmo antes de carregar', () => {
    const {container} = renderSection();
    expect(container.querySelector('#planos')).not.toBeNull();
    expect(screen.getByText('Planos')).toBeInTheDocument();
  });

  it('renderiza todos os planos ativos vindos da API, inclusive o gratuito', async () => {
    renderSection();
    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });
  });

  it('exibe o plano gratuito como "Grátis", sem sufixo de período', async () => {
    renderSection();
    await waitFor(() => expect(screen.getByText('Free')).toBeInTheDocument());

    expect(screen.getByText('Grátis')).toBeInTheDocument();
    expect(screen.queryByText('R$ 0,00')).not.toBeInTheDocument();
  });

  it('ordena os planos por preço crescente', async () => {
    renderSection();
    await waitFor(() => expect(screen.getByText('Free')).toBeInTheDocument());

    const names = screen.getAllByRole('heading', {level: 3}).map((h) => h.textContent);
    expect(names).toEqual(['Free', 'Pro']);
  });

  it('usa link direto para /register no CTA do plano gratuito', async () => {
    renderSection();
    await waitFor(() => expect(screen.getByText('Free')).toBeInTheDocument());

    const freeCta = screen.getByRole('link', {name: /Começar grátis/i});
    expect(freeCta).toHaveAttribute('href', '/register');
  });

  it('abre o modal de captura ao clicar no CTA de um plano pago', async () => {
    renderSection();
    await waitFor(() => expect(screen.getByText('Pro')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', {name: /Assinar Pro/i}));

    expect(screen.getByText(/Quero o plano Pro/i)).toBeInTheDocument();
  });

  it('destaca o plano marcado com isFeatured', async () => {
    renderSection();
    await waitFor(() => expect(screen.getByText('Pro')).toBeInTheDocument());

    expect(screen.getByText('Mais escolhido')).toBeInTheDocument();
  });

  it('destaca apenas o primeiro plano quando mais de um tem isFeatured', async () => {
    (SubscriptionService.getPlans as any).mockResolvedValue(
      mockPlans.map((plan) => ({...plan, isFeatured: true})),
    );
    renderSection();
    await waitFor(() => expect(screen.getByText('Pro')).toBeInTheDocument());

    expect(screen.getAllByText('Mais escolhido')).toHaveLength(1);
  });

  it('não renderiza destaque quando nenhum plano está marcado', async () => {
    (SubscriptionService.getPlans as any).mockResolvedValue(
      mockPlans.map((plan) => ({...plan, isFeatured: false})),
    );
    renderSection();
    await waitFor(() => expect(screen.getByText('Pro')).toBeInTheDocument());

    expect(screen.queryByText('Mais escolhido')).not.toBeInTheDocument();
  });

  it('não quebra a renderização quando a API falha, e oferece retry', async () => {
    (SubscriptionService.getPlans as any).mockRejectedValue(new Error('network'));
    const {container} = renderSection();

    await waitFor(() =>
      expect(screen.getByTestId('pricing-plans-error')).toBeInTheDocument(),
    );
    expect(container.querySelector('#planos')).not.toBeNull();
    expect(screen.getByRole('button', {name: /Tentar novamente/i})).toBeInTheDocument();
  });

  it('mostra estado de carregamento enquanto a API não responde', () => {
    (SubscriptionService.getPlans as any).mockReturnValue(new Promise(() => {}));
    renderSection();

    expect(screen.getByTestId('pricing-plans-loading')).toBeInTheDocument();
  });
});
