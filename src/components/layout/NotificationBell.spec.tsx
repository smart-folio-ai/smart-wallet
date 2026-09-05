import {beforeEach, describe, expect, it, vi} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {INotification} from '@/interface/notification';
import {NotificationBell} from './NotificationBell';

const {listMock, unreadCountMock, markAsReadMock, markAllAsReadMock} =
  vi.hoisted(() => ({
    listMock: vi.fn(),
    unreadCountMock: vi.fn(),
    markAsReadMock: vi.fn(),
    markAllAsReadMock: vi.fn(),
  }));

vi.mock('@/services/notifications', () => ({
  default: {
    list: (...args: unknown[]) => listMock(...args),
    getUnreadCount: (...args: unknown[]) => unreadCountMock(...args),
    markAsRead: (...args: unknown[]) => markAsReadMock(...args),
    markAllAsRead: (...args: unknown[]) => markAllAsReadMock(...args),
  },
}));

function makeNotification(overrides: Partial<INotification> = {}): INotification {
  return {
    id: 'n1',
    type: 'portfolio.rebalance',
    title: 'Sua carteira saiu do alvo',
    body: 'Renda variável passou de 70% da alocação planejada.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    readAt: null,
    ...overrides,
  };
}

function renderBell() {
  const client = new QueryClient({
    defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<NotificationBell />} />
          <Route path="/portfolio" element={<div>portfolio-page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function openPanel() {
  fireEvent.click(screen.getByRole('button', {name: /notificações/i}));
  await waitFor(() => expect(listMock).toHaveBeenCalled());
}

describe('NotificationBell (TRA-136)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unreadCountMock.mockResolvedValue({unreadCount: 0});
    listMock.mockResolvedValue({items: [], nextCursor: null, unreadCount: 0});
    markAsReadMock.mockImplementation(async (id: string) =>
      makeNotification({id, readAt: new Date().toISOString()}),
    );
    markAllAsReadMock.mockResolvedValue({updated: 1});
  });

  it('renders the unread badge with the count from the API', async () => {
    unreadCountMock.mockResolvedValue({unreadCount: 3});
    renderBell();

    await waitFor(() =>
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('3'),
    );
    expect(
      screen.getByRole('button', {name: /notificações \(3 não lidas\)/i}),
    ).toBeInTheDocument();
  });

  it('caps the badge at "9+" for large unread counts', async () => {
    unreadCountMock.mockResolvedValue({unreadCount: 42});
    renderBell();

    await waitFor(() =>
      expect(screen.getByTestId('notification-badge')).toHaveTextContent('9+'),
    );
  });

  it('renders no badge at all when there is nothing unread', async () => {
    renderBell();

    await waitFor(() => expect(unreadCountMock).toHaveBeenCalled());
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    // O sino continua acessível pelo mesmo nome usado pela topbar.
    expect(
      screen.getByRole('button', {name: /notificações/i}),
    ).toBeInTheDocument();
  });

  it('shows the empty state when the user has no notifications', async () => {
    renderBell();
    await openPanel();

    expect(
      await screen.findByText(/nenhuma notificação por aqui/i),
    ).toBeInTheDocument();
  });

  it('marks a notification as read when it is clicked', async () => {
    unreadCountMock.mockResolvedValue({unreadCount: 1});
    listMock.mockResolvedValue({
      items: [makeNotification()],
      nextCursor: null,
      unreadCount: 1,
    });

    renderBell();
    await openPanel();

    fireEvent.click(await screen.findByText(/sua carteira saiu do alvo/i));

    await waitFor(() => expect(markAsReadMock).toHaveBeenCalledWith('n1'));
  });

  it('does not re-mark a notification that is already read', async () => {
    listMock.mockResolvedValue({
      items: [makeNotification({readAt: new Date().toISOString()})],
      nextCursor: null,
      unreadCount: 0,
    });

    renderBell();
    await openPanel();

    fireEvent.click(await screen.findByText(/sua carteira saiu do alvo/i));

    await waitFor(() => expect(markAsReadMock).not.toHaveBeenCalled());
  });

  it('navigates to action.route when a notification with an action is clicked', async () => {
    listMock.mockResolvedValue({
      items: [
        makeNotification({
          action: {label: 'Ver carteira', route: '/portfolio'},
        }),
      ],
      nextCursor: null,
      unreadCount: 1,
    });

    renderBell();
    await openPanel();

    fireEvent.click(await screen.findByText(/sua carteira saiu do alvo/i));

    expect(await screen.findByText('portfolio-page')).toBeInTheDocument();
  });

  it('offers "marcar todas como lidas" only while something is unread', async () => {
    unreadCountMock.mockResolvedValue({unreadCount: 2});
    listMock.mockResolvedValue({
      items: [makeNotification(), makeNotification({id: 'n2'})],
      nextCursor: null,
      unreadCount: 2,
    });

    renderBell();
    await openPanel();

    fireEvent.click(
      await screen.findByRole('button', {name: /marcar todas como lidas/i}),
    );

    await waitFor(() => expect(markAllAsReadMock).toHaveBeenCalled());
  });

  it('hides "marcar todas como lidas" when everything is already read', async () => {
    listMock.mockResolvedValue({
      items: [makeNotification({readAt: new Date().toISOString()})],
      nextCursor: null,
      unreadCount: 0,
    });

    renderBell();
    await openPanel();

    await screen.findByText(/sua carteira saiu do alvo/i);
    expect(
      screen.queryByRole('button', {name: /marcar todas como lidas/i}),
    ).not.toBeInTheDocument();
  });

  it('keeps the bell usable and shows a recovery state when the list fails', async () => {
    listMock.mockRejectedValue(new Error('500'));

    renderBell();
    await openPanel();

    expect(
      await screen.findByText(/não foi possível carregar suas notificações/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /notificações/i}),
    ).toBeEnabled();
  });

  it('loads the next page through "Carregar mais" when a cursor is returned', async () => {
    listMock
      .mockResolvedValueOnce({
        items: [makeNotification()],
        nextCursor: 'cursor-2',
        unreadCount: 1,
      })
      .mockResolvedValueOnce({
        items: [makeNotification({id: 'n2', title: 'Relatório pronto'})],
        nextCursor: null,
        unreadCount: 1,
      });

    renderBell();
    await openPanel();

    fireEvent.click(await screen.findByRole('button', {name: /carregar mais/i}));

    expect(await screen.findByText('Relatório pronto')).toBeInTheDocument();
    expect(listMock).toHaveBeenLastCalledWith({limit: 20, cursor: 'cursor-2'});
  });
});
