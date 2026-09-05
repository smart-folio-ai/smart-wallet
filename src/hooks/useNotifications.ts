import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import type {
  INotificationPage,
  IUnreadCountResponse,
} from '@/interface/notification';
import notificationService from '@/services/notifications';

/**
 * TRA-136 — central de notificações in-app.
 *
 * Sem websocket/realtime nesta iteração: a contagem de não lidas se atualiza
 * por `refetchOnWindowFocus` + um `refetchInterval` modesto (60s). A lista só
 * é buscada quando o popover abre (`enabled`), para não pagar request em toda
 * navegação.
 */

const PAGE_SIZE = 20;
const UNREAD_POLL_MS = 60_000;

export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  feed: () => [...notificationKeys.all, 'feed'] as const,
};

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    select: (data: IUnreadCountResponse) => data?.unreadCount ?? 0,
    staleTime: 30_000,
    refetchInterval: UNREAD_POLL_MS,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

export function useNotificationFeed(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: notificationKeys.feed(),
    queryFn: ({pageParam}) =>
      notificationService.list({
        limit: PAGE_SIZE,
        ...(pageParam ? {cursor: pageParam} : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: INotificationPage) =>
      lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

type FeedCache = InfiniteData<INotificationPage, string | undefined>;

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({queryKey: notificationKeys.all});

      const previousFeed = queryClient.getQueryData<FeedCache>(
        notificationKeys.feed(),
      );
      const previousCount = queryClient.getQueryData<IUnreadCountResponse>(
        notificationKeys.unreadCount(),
      );

      const wasUnread = previousFeed?.pages.some((page) =>
        page.items.some((item) => item.id === id && !item.readAt),
      );

      if (previousFeed) {
        const readAt = new Date().toISOString();
        queryClient.setQueryData<FeedCache>(notificationKeys.feed(), {
          ...previousFeed,
          pages: previousFeed.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === id && !item.readAt ? {...item, readAt} : item,
            ),
          })),
        });
      }

      if (previousCount && wasUnread) {
        queryClient.setQueryData<IUnreadCountResponse>(
          notificationKeys.unreadCount(),
          {unreadCount: Math.max(0, previousCount.unreadCount - 1)},
        );
      }

      return {previousFeed, previousCount};
    },
    onError: (_error, _id, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(notificationKeys.feed(), context.previousFeed);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          context.previousCount,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: notificationKeys.all});
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData<IUnreadCountResponse>(
        notificationKeys.unreadCount(),
        {unreadCount: 0},
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({queryKey: notificationKeys.all});
    },
  });
}
