import {describe, it, expect, vi, beforeAll, beforeEach} from 'vitest';
import {render, screen, within} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {SidebarProvider} from '@/components/ui/sidebar';
import {AppSidebar} from './app-sidebar';

vi.mock('@/services/portfolio', () => ({
  default: {getAssets: vi.fn().mockResolvedValue([])},
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({role: null}),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

beforeEach(() => {
  localStorage.clear();
});

function renderSidebar(path = '/dashboard') {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const linkLabels = () =>
  screen.getAllByRole('link').map((link) => link.textContent?.trim());

describe('AppSidebar', () => {
  // Mesma ordem e rótulos do `NAV` de design_handoff_trackerr/Trackerr App.dc.html.
  it('renders the handoff navigation: same groups, labels and order', () => {
    renderSidebar();

    for (const group of ['Carteira', 'Inteligência', 'Planejamento', 'Conta']) {
      // "Planejamento" é grupo e item ao mesmo tempo, como no handoff
      expect(screen.getAllByText(group)[0]).toBeInTheDocument();
    }
    expect(screen.queryByText('Administração')).not.toBeInTheDocument();

    expect(linkLabels()).toEqual([
      'Dashboard',
      'Portfólio',
      'Dividendos',
      'Transações',
      'Adicionar ativo',
      'IA Insights',
      'Copiloto',
      'RI Inteligente',
      'Research',
      'Comparador',
      'Planejamento',
      'Fiscal & IR',
      'Relatórios',
      'Contas conectadas',
      'Segurança',
      'Assinatura',
      'Configurações',
    ]);
  });

  it('shows the handoff security footer', () => {
    renderSidebar();
    expect(screen.getByText('Ambiente seguro · LGPD')).toBeInTheDocument();
    expect(screen.getByText('Dados cifrados AES-256 · senhas com Argon2id')).toBeInTheDocument();
    expect(screen.queryByText(/Uptime/)).not.toBeInTheDocument();
  });

  it('adds "Ativo · {símbolo}" right after Dividendos once an asset has been opened', () => {
    renderSidebar('/asset/PETR4');

    const labels = linkLabels();
    expect(labels.slice(2, 4)).toEqual(['Dividendos', 'Ativo · PETR4']);
    expect(screen.getByRole('link', {name: 'Ativo · PETR4'})).toHaveAttribute(
      'href',
      '/asset/PETR4',
    );
  });

  it('marks the asset item active on the asset page, not Portfólio', () => {
    renderSidebar('/portfolio/asset/symbol/VALE3');

    const asset = screen.getByRole('link', {name: 'Ativo · VALE3'});
    const portfolio = screen.getByRole('link', {name: 'Portfólio'});
    expect(asset.className).toContain('bg-[rgba(152,160,171,0.16)]');
    expect(portfolio.className).not.toContain('bg-[rgba(152,160,171,0.16)]');
  });

  it('renders each item with its handoff Phosphor icon', () => {
    renderSidebar();
    const research = screen.getByRole('link', {name: 'Research'});
    expect(within(research).getByText('', {selector: 'i'})).toHaveClass(
      'ph',
      'ph-magnifying-glass',
    );
  });
});
