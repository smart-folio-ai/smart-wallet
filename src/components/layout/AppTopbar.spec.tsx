import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {SidebarProvider} from '@/components/ui/sidebar';
import {AppTopbar} from './AppTopbar';

const mockUseSubscription = vi.fn();

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => mockUseSubscription(),
}));

function renderTopbar() {
  return render(
    <MemoryRouter>
      <SidebarProvider>
        <AppTopbar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

describe('AppTopbar', () => {
  beforeEach(() => {
    mockUseSubscription.mockReturnValue({
      planName: null,
      isSubscribed: false,
      isLoading: false,
    });
  });

  it('renders a Configurações icon button next to Notificações', () => {
    renderTopbar();
    expect(
      screen.getByRole('button', {name: /configurações/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /notificações/i}),
    ).toBeInTheDocument();
  });

  it('shows an "Upgrade" subscription CTA for a free user', () => {
    renderTopbar();
    expect(
      screen.getByRole('button', {name: /upgrade/i}),
    ).toBeInTheDocument();
  });

  it('shows the current plan name for a subscribed user instead of Upgrade', () => {
    mockUseSubscription.mockReturnValue({
      planName: 'Investidor Pro',
      isSubscribed: true,
      isLoading: false,
    });
    renderTopbar();
    expect(screen.getByText('Investidor Pro')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {name: /^upgrade$/i}),
    ).not.toBeInTheDocument();
  });

  it('does not render the old static "SaaS Preview" badge', () => {
    renderTopbar();
    expect(screen.queryByText('SaaS Preview')).not.toBeInTheDocument();
  });
});
