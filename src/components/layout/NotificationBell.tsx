import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {AlertCircle, ArrowRight, Bell, Check} from '@/components/ui/icons';
import {cn} from '@/lib/utils';
import {formatRelativeTime} from '@/lib/relative-time';
import type {INotification} from '@/interface/notification';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationFeed,
  useUnreadNotificationCount,
} from '@/hooks/useNotifications';

/**
 * TRA-136 — sino de notificações da topbar.
 *
 * Substitui o ponto vermelho estático do handoff (TRA-128) por um badge real
 * alimentado por `unreadCount`. O painel segue a linguagem visual do
 * CommandPalette (borda brand/30, cabeçalho com hairline, itens 13px), já que
 * o handoff não tem tela dedicada de notificações.
 */

function NotificationRow({
  notification,
  onSelect,
}: {
  notification: INotification;
  onSelect: (notification: INotification) => void;
}) {
  const isUnread = !notification.readAt;

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        'flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-brand/10',
        isUnread && 'bg-brand/[0.06]',
      )}>
      <span
        aria-hidden="true"
        className={cn(
          'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
          isUnread ? 'bg-brand' : 'bg-transparent',
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              'flex-1 truncate text-[13px] text-foreground',
              isUnread ? 'font-semibold' : 'font-medium',
            )}>
            {notification.title}
          </span>
          <span className="shrink-0 text-[10.5px] text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
          {notification.body}
        </span>
        {notification.action ? (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand">
            {notification.action.label}
            <ArrowRight className="h-3 w-3" />
          </span>
        ) : null}
      </span>
      {isUnread ? <span className="sr-only">não lida</span> : null}
    </button>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const {data: unreadCount = 0} = useUnreadNotificationCount();
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotificationFeed(open);
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const hasUnread = unreadCount > 0 || items.some((item) => !item.readAt);
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);
  const ariaLabel =
    unreadCount > 0
      ? `Notificações (${unreadCount} não lidas)`
      : 'Notificações';

  const handleSelect = (notification: INotification) => {
    if (!notification.readAt) markAsRead.mutate(notification.id);
    if (notification.action) {
      setOpen(false);
      navigate(notification.action.route);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-8 w-8 border-border/70 text-muted-foreground hover:text-foreground"
          aria-label={ariaLabel}
          title={ariaLabel}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span
              data-testid="notification-badge"
              className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-brand px-1 text-[9px] font-semibold leading-none text-white">
              {badgeLabel}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] overflow-hidden border-brand/30 p-0 shadow-lg">
        <div className="flex items-center gap-2 border-b border-border/60 px-3.5 py-3">
          <Bell className="h-[15px] w-[15px] shrink-0 text-brand" />
          <p className="flex-1 text-[13px] font-semibold text-foreground">
            Notificações
          </p>
          {hasUnread ? (
            <button
              type="button"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-brand transition-colors hover:bg-brand/10 disabled:opacity-60">
              <Check className="h-3 w-3" />
              marcar todas como lidas
            </button>
          ) : null}
        </div>

        <div className="max-h-[52vh] overflow-y-auto px-2 py-2">
          {isLoading ? (
            <div className="space-y-2 p-1" data-testid="notifications-loading">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-2.5">
                  <Skeleton className="mt-1.5 h-1.5 w-1.5 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="px-4 py-8 text-center">
              <AlertCircle className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 text-[13px] text-foreground">
                Não foi possível carregar suas notificações
              </p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                O restante do app continua funcionando normalmente.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 h-7 border-brand/60 text-[11.5px] text-brand hover:bg-brand/10 hover:text-brand"
                onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 text-[13px] text-foreground">
                Nenhuma notificação por aqui
              </p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                Avisos sobre a sua carteira, relatórios e cobranças aparecem
                nesta lista.
              </p>
            </div>
          ) : (
            <>
              {items.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onSelect={handleSelect}
                />
              ))}
              {hasNextPage ? (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="mt-1 w-full rounded-lg px-2.5 py-2 text-[11.5px] font-medium text-brand transition-colors hover:bg-brand/10 disabled:opacity-60">
                  {isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
                </button>
              ) : null}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
