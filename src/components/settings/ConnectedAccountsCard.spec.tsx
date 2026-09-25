import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import {ConnectedAccountsCard} from './ConnectedAccountsCard';
import {brokerSyncService} from '@/server/api/api';
import {useSubscription} from '@/hooks/useSubscription';

vi.mock('@/hooks/useSubscription');
vi.mock('@/server/api/api', () => ({brokerSyncService: {getConnections: vi.fn()}}));

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
      <MemoryRouter>
        <ConnectedAccountsCard />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('ConnectedAccountsCard', () => {
  beforeEach(() => vi.clearAllMocks());

  // Sincronização com corretora é exclusiva do plano Pro.
  it('only invites to upgrade outside Pro and never loads connections', () => {
    vi.mocked(useSubscription).mockReturnValue({hasBrokerSync: false, isLoading: false} as never);
    renderCard();

    expect(screen.getByText('Disponível no plano Pro')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Ver planos'})).toHaveAttribute('href', '/plans');
    expect(screen.queryByRole('link', {name: 'Conectar corretora'})).not.toBeInTheDocument();
    expect(brokerSyncService.getConnections).not.toHaveBeenCalled();
  });

  it('lists the connections on Pro', async () => {
    vi.mocked(useSubscription).mockReturnValue({hasBrokerSync: true, isLoading: false} as never);
    vi.mocked(brokerSyncService.getConnections).mockResolvedValue({
      data: [{id: 'c1', provider: 'xp', status: 'connected'}],
    } as never);
    renderCard();

    expect(await screen.findByText('XP Investimentos')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Conectar corretora'})).toHaveAttribute('href', '/sync-accounts');
  });
});
