import {useMemo} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type {IPushSubscriptionState} from '@/interface/notification';
import pushService from '@/services/notifications/push';
import {detectPushAvailability, type PushAvailability} from '@/lib/web-push';
import {notificationKeys} from '@/hooks/useNotifications';

/**
 * TRA-136 (fase 6) — estado do Web Push para a UI.
 *
 * Ler a permissão e a assinatura existente é assíncrono e cacheável, então vai
 * por React Query em vez de `useEffect` + `useState`. A query só roda em
 * ambiente suportado, e nunca dispara prompt: pedir permissão é exclusividade
 * das mutations, chamadas a partir do clique do usuário.
 */

const UNAVAILABLE_STATE: IPushSubscriptionState = {
  permission: 'denied',
  subscribed: false,
};

export const pushNotificationKeys = {
  all: [...notificationKeys.all, 'push'] as const,
  state: () => [...pushNotificationKeys.all, 'state'] as const,
};

export interface UsePushNotificationsResult {
  availability: PushAvailability;
  /** Ambiente capaz de push (não diz nada sobre a permissão). */
  isAvailable: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isDenied: boolean;
  isLoading: boolean;
  isUpdating: boolean;
  error: Error | null;
  enable: () => void;
  disable: () => void;
  toggle: (next: boolean) => void;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const queryClient = useQueryClient();
  const availability = useMemo(() => detectPushAvailability(), []);
  const isAvailable = availability.status === 'supported';

  const stateQuery = useQuery({
    queryKey: pushNotificationKeys.state(),
    queryFn: () => pushService.getSubscriptionState(),
    enabled: isAvailable,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const setState = (state: IPushSubscriptionState) => {
    queryClient.setQueryData(pushNotificationKeys.state(), state);
  };

  const enableMutation = useMutation({
    mutationFn: () => pushService.subscribe(),
    onSuccess: setState,
  });

  const disableMutation = useMutation({
    mutationFn: () => pushService.unsubscribe(),
    onSuccess: setState,
  });

  const state = isAvailable
    ? (stateQuery.data ?? UNAVAILABLE_STATE)
    : UNAVAILABLE_STATE;

  const enable = () => {
    if (!isAvailable || state.permission === 'denied') return;
    enableMutation.mutate();
  };

  const disable = () => {
    if (!isAvailable) return;
    disableMutation.mutate();
  };

  return {
    availability,
    isAvailable,
    permission: state.permission,
    isSubscribed: state.subscribed,
    // 'denied' só é relevante quando o ambiente suporta push; caso contrário
    // a UI mostra a mensagem de indisponibilidade, não a de bloqueio.
    isDenied: isAvailable && state.permission === 'denied',
    isLoading: isAvailable && stateQuery.isLoading,
    isUpdating: enableMutation.isPending || disableMutation.isPending,
    error:
      (enableMutation.error as Error | null) ??
      (disableMutation.error as Error | null),
    enable,
    disable,
    toggle: (next: boolean) => (next ? enable() : disable()),
  };
}
