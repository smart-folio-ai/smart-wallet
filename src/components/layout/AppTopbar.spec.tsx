import {describe, it, expect, vi, beforeEach, beforeAll} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {SidebarProvider} from '@/components/ui/sidebar';
import {AppTopbar} from './AppTopbar';

const mockUseSubscription = vi.fn();
const mockUseCurrentUserProfile = vi.fn();
const mockSetLevel = vi.fn();

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => mockUseSubscription(),
}));

vi.mock('@/hooks/useCurrentUserProfile', () => ({
  useCurrentUserProfile: () => mockUseCurrentUserProfile(),
}));

vi.mock('@/contexts/AdaptiveLevelContext', () => ({
  useAdaptiveLevel: () => ({level: 'intermediario', setLevel: mockSetLevel}),
}));

vi.mock('@/components/ThemeToggle', () => ({
  useThemeToggle: () => ({theme: 'light', toggleTheme: vi.fn()}),
}));

vi.mock('@/services/portfolio', () => ({
  default: {getPortfolios: vi.fn().mockResolvedValue([])},
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

function renderTopbar() {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <SidebarProvider>
          <Routes>
            <Route path="/" element={<AppTopbar />} />
            <Route path="/signout" element={<div>signout-page</div>} />
          </Routes>
        </SidebarProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AppTopbar', () => {
  beforeEach(() => {
    mockUseSubscription.mockReturnValue({
      planName: null,
      isSubscribed: false,
      isLoading: false,
    });
    mockUseCurrentUserProfile.mockReturnValue({
      data: {firstName: 'Ana', lastName: 'Costa', email: 'ana@example.com'},
      isLoading: false,
    });
  });

  it('renders Notificações and Nova carteira controls', () => {
    renderTopbar();
    expect(
      screen.getByRole('button', {name: /notificações/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /nova carteira/i}),
    ).toBeInTheDocument();
  });

  it('shows an "Upgrade" subscription CTA for a free user', () => {
    renderTopbar();
    expect(
      screen.getByRole('button', {name: /upgrade/i}),
    ).toBeInTheDocument();
  });

  it('shows the current plan name in the avatar block for a subscribed user', () => {
    mockUseSubscription.mockReturnValue({
      planName: 'investidor pro',
      displayPlanName: 'Investidor Pro',
      isSubscribed: true,
      isLoading: false,
    });
    renderTopbar();
    expect(screen.getByText(/Plano Investidor Pro/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {name: /^upgrade$/i}),
    ).not.toBeInTheDocument();
  });

  it('does not render the old static "SaaS Preview" badge', () => {
    renderTopbar();
    expect(screen.queryByText('SaaS Preview')).not.toBeInTheDocument();
  });

  it('does not flash the Upgrade CTA while the subscription query is loading', () => {
    mockUseSubscription.mockReturnValue({
      planName: null,
      displayPlanName: null,
      isSubscribed: false,
      isLoading: true,
    });
    renderTopbar();
    expect(
      screen.queryByRole('button', {name: /upgrade/i}),
    ).not.toBeInTheDocument();
  });

  it('shows the user avatar with initials and a dropdown that navigates to /signout on logout', async () => {
    const user = userEvent.setup();
    renderTopbar();
    const trigger = screen.getByText('AC').closest('button')!;
    await user.click(trigger);
    expect(screen.getByText('Sair')).toBeInTheDocument();
    await user.click(screen.getByText('Sair'));
    expect(screen.getByText('signout-page')).toBeInTheDocument();
  });

  it('shows the adaptive-depth level switcher and lets the user change level', async () => {
    const user = userEvent.setup();
    renderTopbar();
    expect(screen.getByText('Intermediário')).toBeInTheDocument();
    await user.click(screen.getByText('Avançado'));
    expect(mockSetLevel).toHaveBeenCalledWith('avancado');
  });

  it('opens the command palette when the search field is clicked', async () => {
    const user = userEvent.setup();
    renderTopbar();
    await user.click(screen.getByText(/buscar ativo, relatório/i));
    expect(screen.getByPlaceholderText(/buscar uma tela/i)).toBeInTheDocument();
  });
});
