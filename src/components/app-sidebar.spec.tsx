import {describe, it, expect, vi, beforeAll} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {SidebarProvider} from '@/components/ui/sidebar';
import {AppSidebar} from './app-sidebar';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({role: null}),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
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

function renderSidebar() {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

describe('AppSidebar', () => {
  it('renders exactly two fixed nav sections for a non-admin user', () => {
    renderSidebar();
    expect(screen.getByText('Investir')).toBeInTheDocument();
    expect(screen.getByText('Inteligência')).toBeInTheDocument();
    expect(screen.queryByText('Visão Geral')).not.toBeInTheDocument();
    expect(screen.queryByText('Análise')).not.toBeInTheDocument();
    expect(screen.queryByText('Carteira')).not.toBeInTheDocument();
    expect(screen.queryByText('Conectar')).not.toBeInTheDocument();
    expect(screen.queryByText('Administração')).not.toBeInTheDocument();
  });

  it('does not render Configurações or Assinatura links in the sidebar', () => {
    renderSidebar();
    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
    expect(screen.queryByText('Assinatura')).not.toBeInTheDocument();
    expect(screen.getByText('Sair')).toBeInTheDocument();
  });

  it('keeps every previously available route reachable in the two sections', () => {
    renderSidebar();
    const expectedLabels = [
      'Dashboard',
      'Portfólio',
      'Adicionar Ativo',
      'Dividendos',
      'Transações',
      'Planejamento',
      'Comparador',
      'IA Insights',
      'Chat Inteligente',
      'Buscar Ativos',
      'RI Inteligente',
      'Fiscal',
      'Sincronizar Contas',
    ];
    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
