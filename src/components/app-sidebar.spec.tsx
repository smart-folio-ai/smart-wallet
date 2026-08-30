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
  it('renders the four fixed nav sections for a non-admin user', () => {
    renderSidebar();
    const groupLabelSelector = '[data-sidebar="group-label"]';
    expect(
      screen.getByText('Carteira', {selector: groupLabelSelector}),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Inteligência', {selector: groupLabelSelector}),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Planejamento', {selector: groupLabelSelector}),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Conta', {selector: groupLabelSelector}),
    ).toBeInTheDocument();
    expect(screen.queryByText('Investir')).not.toBeInTheDocument();
    expect(screen.queryByText('Administração')).not.toBeInTheDocument();
  });

  it('renders Configurações and Assinatura links, and no Sair link', () => {
    renderSidebar();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(screen.getByText('Assinatura')).toBeInTheDocument();
    expect(screen.queryByText('Sair')).not.toBeInTheDocument();
  });

  it('shows the SOC 2 · LGPD badge in the footer', () => {
    renderSidebar();
    expect(screen.getByText('SOC 2 · LGPD')).toBeInTheDocument();
  });

  it('keeps every previously available route reachable across the four sections', () => {
    renderSidebar();
    const expectedLabels = [
      'Dashboard',
      'Portfólio',
      'Dividendos',
      'Transações',
      'Adicionar Ativo',
      'IA Insights',
      'Chat Inteligente',
      'Buscar Ativos',
      'RI Inteligente',
      'Planejamento',
      'Comparador',
      'Fiscal',
      'Contas Conectadas',
      'Configurações',
      'Assinatura',
    ];
    for (const label of expectedLabels) {
      const matches = screen.getAllByText(label);
      expect(matches.some((el) => el.closest('a'))).toBe(true);
    }
  });
});
