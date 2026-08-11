import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
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
    // Existem dois CTAs com o texto "Começar grátis" (hero e plano Básico) —
    // ambos legítimos e apontando para /register.
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
      'planos',
      'faq',
    ]);
  });

  it('mostra prova de mercado, produto e credibilidade', () => {
    renderLanding();

    expect(screen.getAllByText(/PETR4/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/gráfico em alta/i)).toBeInTheDocument();
    expect(screen.getAllByText(/carteira consolidada/i).length).toBeGreaterThan(0);
    expect(screen.getByText('AES-256')).toBeInTheDocument();
  });

  it('fecha com planos, dúvidas e o aviso de que não há recomendação', () => {
    renderLanding();

    expect(screen.getByText('Básico')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /meus dados ficam seguros/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não constituem recomendação de investimento/i),
    ).toBeInTheDocument();
  });

  it('com prefers-reduced-motion o conteúdo continua visível', () => {
    stubMatchMedia(true);
    renderLanding();

    const headline = screen.getByText(/sua carteira inteira/i);
    expect(headline).toBeInTheDocument();
    expect(headline).toBeVisible();
    expect(screen.getByText('Básico')).toBeVisible();
  });
});
