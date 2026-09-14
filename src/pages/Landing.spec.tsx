import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {render, screen, within, fireEvent, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import Landing from './Landing';
import SubscriptionService from '@/services/subscription';

vi.mock('@/services/subscription');
vi.mock('@/components/landing/showcase/ShowcaseVideo', () => ({
  ShowcaseVideo: () => <div data-testid="showcase-video" />,
}));

const plans = [
  {
    _id: 'plan_pro',
    name: 'Pro',
    description: 'Para quem já tem carteira montada',
    price: 14.9,
    currency: 'brl',
    interval: 'month',
    intervalCount: 1,
    isActive: true,
    isFeatured: true,
    features: ['Ativos ilimitados', 'Módulo fiscal'],
  },
  {
    _id: 'plan_free',
    name: 'Essencial',
    description: 'Para quem está começando',
    price: 0,
    currency: 'brl',
    interval: 'month',
    intervalCount: 1,
    isActive: true,
    features: ['Até 10 ativos'],
  },
  {
    _id: 'plan_old',
    name: 'Legado',
    description: 'desativado',
    price: 5,
    currency: 'brl',
    interval: 'month',
    intervalCount: 1,
    isActive: false,
    features: [],
  },
];

const renderLanding = () => {
  const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Landing (design_handoff_trackerr/Trackerr Landing.dc.html)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (SubscriptionService.getPlans as any).mockResolvedValue(plans);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('renders the handoff hero, header navigation and conversion paths', () => {
    renderLanding();

    expect(screen.getByText('Copiloto de investimentos · AI-native')).toBeInTheDocument();
    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
      'Sua carteira inteira,lida por uma IA que explica o porquê.',
    );
    for (const label of ['Produto', 'Como funciona', 'Segurança', 'Planos', 'FAQ']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    // "Entrar" aparece no header e no rodapé, como no handoff.
    for (const link of screen.getAllByRole('link', {name: 'Entrar'})) {
      expect(link).toHaveAttribute('href', '/signin');
    }
    expect(screen.getByRole('link', {name: /Criar minha conta/})).toHaveAttribute('href', '/register');
    expect(screen.getByTestId('showcase-video')).toBeInTheDocument();
  });

  it('renders the sections in the handoff order', () => {
    const {container} = renderLanding();
    const ids = Array.from(container.querySelectorAll('section[id]')).map((el) => el.id);

    expect(ids).toEqual([
      'inicio',
      'veja-em-acao',
      'produto',
      'profundidade',
      'como-funciona',
      'seguranca',
      'planos',
      'faq',
    ]);
  });

  it('shows only true security claims (no SOC 2, no uptime figure)', () => {
    renderLanding();
    const trust = document.getElementById('seguranca') as HTMLElement;

    for (const value of ['AES-256', 'Argon2id', 'LGPD', '2FA']) {
      expect(within(trust).getByText(value)).toBeInTheDocument();
    }
    expect(screen.queryByText(/SOC 2/)).not.toBeInTheDocument();
    expect(screen.queryByText(/99,98%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/CNPJ 00\.000\.000/)).not.toBeInTheDocument();
  });

  it('switches the adaptive-depth preview between the three levels', () => {
    renderLanding();

    expect(screen.getByText('Risco e atribuição')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Iniciante'}));
    expect(screen.getByText('Resumo da carteira')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Iniciante'})).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps one FAQ answer open at a time', () => {
    renderLanding();

    expect(screen.getByText(/cifrados em repouso com AES-256/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /Posso cancelar quando quiser/}));
    expect(screen.getByText(/pelo próprio painel, sem falar com ninguém/)).toBeInTheDocument();
    expect(screen.queryByText(/cifrados em repouso com AES-256/)).not.toBeInTheDocument();
  });

  it('renders real Stripe plans sorted by price, with the featured badge and the right CTA per plan', async () => {
    renderLanding();

    await waitFor(() => expect(screen.getAllByTestId('landing-plan')).toHaveLength(2));
    const cards = screen.getAllByTestId('landing-plan');
    expect(within(cards[0]).getByText('Essencial')).toBeInTheDocument();
    expect(within(cards[0]).getByText('Grátis')).toBeInTheDocument();
    expect(within(cards[0]).getByRole('link', {name: 'Começar grátis'})).toHaveAttribute('href', '/register');
    expect(within(cards[1]).getByText('Mais assinado')).toBeInTheDocument();
    expect(screen.queryByText('Legado')).not.toBeInTheDocument();

    fireEvent.click(within(cards[1]).getByRole('button', {name: 'Assinar Pro'}));
    expect(await screen.findByText(/Quero o plano Pro/i)).toBeInTheDocument();
  });

  describe('theme and language', () => {
    it('toggles the theme on <html> and restores the previous app theme on unmount', () => {
      document.documentElement.classList.add('dark');
      const {unmount} = renderLanding();

      fireEvent.click(screen.getByRole('button', {name: 'Mudar para tema claro'}));
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(screen.getByRole('button', {name: 'Mudar para tema escuro'})).toBeInTheDocument();

      unmount();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('marks the chosen language and remembers it', () => {
      renderLanding();
      fireEvent.click(screen.getByRole('button', {name: 'EN'}));

      expect(screen.getByRole('button', {name: 'EN'})).toHaveAttribute('aria-pressed', 'true');
      expect(localStorage.getItem('landing-lang')).toBe('en');
    });
  });
});
