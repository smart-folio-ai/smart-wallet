import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {render, screen, within, fireEvent} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import Landing from './Landing';
import SubscriptionService from '@/services/subscription';

vi.mock('@/services/subscription');

const stubMatchMedia = (matches: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
};

const renderLanding = () => {
  const queryClient = new QueryClient({
    defaultOptions: {queries: {retry: false}},
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('Landing', () => {
  beforeEach(() => {
    stubMatchMedia(false);
    vi.clearAllMocks();
    (SubscriptionService.getPlans as any).mockResolvedValue([]);
  });

  it('abre com a promessa central e o caminho de conversão', () => {
    renderLanding();

    expect(screen.getAllByText('Trackerr').length).toBeGreaterThan(0);
    expect(screen.getByText(/sua carteira inteira/i)).toBeInTheDocument();
    expect(
      screen.getByText(/sem planilha, sem surpresa no ir/i),
    ).toBeInTheDocument();
    // O hero sempre expõe um CTA "Começar grátis" apontando para /register.
    // Se a API de planos (mockada vazia neste teste) retornar um plano
    // gratuito, a PricingSection renderiza outro CTA com o mesmo texto —
    // por isso a asserção abaixo tolera um ou mais links, todos para /register.
    const ctaLinks = screen.getAllByRole('link', {name: /começar grátis/i});
    expect(ctaLinks.length).toBeGreaterThan(0);
    ctaLinks.forEach((link) =>
      expect(link).toHaveAttribute('href', '/register'),
    );
  });

  it('renderiza as nove seções na ordem definida', () => {
    const {container} = renderLanding();

    const ids = Array.from(container.querySelectorAll('section[id]')).map(
      (el) => el.id,
    );

    expect(ids).toEqual([
      'inicio',
      'problema',
      'produto',
      'como-funciona',
      'profundidade',
      'planos',
      'faq',
    ]);
  });

  it('mostra prova de mercado, produto e credibilidade', () => {
    renderLanding();

    expect(screen.getAllByText(/PETR4/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/gráfico em alta/i)).toBeInTheDocument();
    expect(screen.getAllByText(/carteira consolidada/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Argon2id')).toBeInTheDocument();
  });

  it('fecha com planos, dúvidas e o aviso de que não há recomendação', () => {
    const {container} = renderLanding();

    const pricingSection = container.querySelector('#planos');
    expect(pricingSection).not.toBeNull();
    expect(
      within(pricingSection as HTMLElement).getByText(
        'Comece grátis. Pague quando fizer diferença.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /meus dados ficam seguros/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não constituem recomendação de investimento/i),
    ).toBeInTheDocument();
  });

  // Regressão: `--surface-base`/`--brand`/etc são declarados em `:root` e
  // `.dark`, que casam com <html> — tirar a classe "dark" só do wrapper da
  // Landing não desfaz um `<html class="dark">` herdado do tema global do
  // app (CSS inheritance só é sobrescrita por uma regra que casa com o
  // PRÓPRIO elemento). O toggle correto aplica a classe em
  // document.documentElement, e precisa restaurar o valor anterior ao
  // desmontar para não vazar tema pro resto do app.
  describe('toggle de tema', () => {
    afterEach(() => {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('landing-theme');
    });

    it('aplica e remove a classe "dark" em document.documentElement ao alternar o tema', () => {
      document.documentElement.classList.remove('dark');
      renderLanding();

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      fireEvent.click(screen.getByRole('button', {name: /ativar tema claro/i}));
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      fireEvent.click(screen.getByRole('button', {name: /ativar tema escuro/i}));
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('restaura o tema global anterior ao desmontar, sem vazar pro resto do app', () => {
      document.documentElement.classList.add('dark');
      const {unmount} = renderLanding();

      fireEvent.click(screen.getByRole('button', {name: /ativar tema claro/i}));
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      unmount();

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('com prefers-reduced-motion o conteúdo continua visível', () => {
    stubMatchMedia(true);
    const {container} = renderLanding();

    const headline = screen.getByText(/sua carteira inteira/i);
    expect(headline).toBeInTheDocument();
    expect(headline).toBeVisible();

    const pricingSection = container.querySelector('#planos');
    expect(
      within(pricingSection as HTMLElement).getByText(
        'Comece grátis. Pague quando fizer diferença.',
      ),
    ).toBeVisible();
  });
});
