import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {
  AlertCircle,
  BellOff,
  DeviceMobile,
  Loader2,
} from '@/components/ui/icons';
import {cn} from '@/lib/utils';
import {usePushNotifications} from '@/hooks/usePushNotifications';
import {PushSubscriptionError} from '@/services/notifications/push';

/**
 * TRA-136 (fase 6) — toggle real de notificações push.
 *
 * Mora nas configurações (aba Notificações) porque a permissão do navegador
 * só pode ser pedida a partir de um gesto deliberado e rotulado: pedir no
 * carregamento da página resulta em negação, e negação é praticamente
 * definitiva. Cada estado do navegador tem um desfecho próprio — nada de
 * switch morto.
 *
 * O handoff não tem tela de push; o layout copia as linhas já existentes da
 * NotificationsTab (Label + descrição muted + Switch à direita).
 */

function errorMessage(error: Error | null): string | null {
  if (!error) return null;

  if (error instanceof PushSubscriptionError) {
    switch (error.code) {
      case 'permission-denied':
        return 'Você bloqueou as notificações. Reative nas permissões do site no seu navegador.';
      case 'permission-dismissed':
        return 'Permissão não concedida. Toque no botão novamente para escolher "Permitir".';
      case 'missing-vapid-key':
      case 'subscribe-failed':
        return 'Não foi possível ativar as notificações push agora. Tente novamente em instantes.';
      case 'unsupported':
        return 'Este navegador não suporta notificações push.';
    }
  }

  return 'Não foi possível salvar sua preferência de notificações push.';
}

function Hint({
  icon: Icon,
  children,
}: {
  icon: typeof AlertCircle;
  children: React.ReactNode;
}) {
  return (
    <p className="mt-2 flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-[12px] leading-snug text-muted-foreground">
      <Icon className="mt-[1px] h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function PushNotificationToggle() {
  const {
    availability,
    isAvailable,
    isSubscribed,
    isDenied,
    isLoading,
    isUpdating,
    error,
    toggle,
  } = usePushNotifications();

  const message = errorMessage(error);
  const disabled = !isAvailable || isDenied || isLoading || isUpdating;

  return (
    <div data-testid="push-notification-toggle">
      <div className="flex items-center justify-between">
        <div className="pr-4">
          <Label
            htmlFor="push-notifications"
            className={cn(disabled && 'text-muted-foreground')}>
            Notificações Push
          </Label>
          <p className="text-sm text-muted-foreground">
            Receba avisos da sua carteira neste dispositivo, mesmo com o
            Trackerr fechado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isUpdating ? (
            <Loader2
              data-testid="push-toggle-spinner"
              aria-hidden="true"
              className="h-4 w-4 animate-spin text-muted-foreground"
            />
          ) : null}
          <Switch
            id="push-notifications"
            checked={isSubscribed}
            disabled={disabled}
            aria-describedby={
              isDenied ? 'push-notifications-denied' : undefined
            }
            onCheckedChange={toggle}
          />
        </div>
      </div>

      {isDenied ? (
        <Hint icon={BellOff}>
          <span id="push-notifications-denied">
            As notificações estão bloqueadas para o Trackerr neste navegador.
            Para reativar, abra o cadeado ao lado do endereço do site,
            encontre <strong>Notificações</strong> e volte para
            &ldquo;Perguntar&rdquo; ou &ldquo;Permitir&rdquo;. Nós não podemos
            perguntar de novo por aqui.
          </span>
        </Hint>
      ) : null}

      {availability.status === 'ios-install-required' ? (
        <Hint icon={DeviceMobile}>
          No iPhone e iPad, as notificações push só funcionam com o Trackerr
          adicionado à tela de início. Toque em <strong>Compartilhar</strong> e
          depois em <strong>Adicionar à Tela de Início</strong> — o toggle
          aparece ao abrir o app por lá.
        </Hint>
      ) : null}

      {availability.status === 'unsupported' ? (
        <Hint icon={AlertCircle}>
          {availability.reason === 'insecure-context'
            ? 'As notificações push exigem uma conexão segura (HTTPS).'
            : 'Este navegador não suporta notificações push. Você continua recebendo os avisos no sino do Trackerr e por email.'}
        </Hint>
      ) : null}

      {message ? (
        <p
          role="alert"
          className="mt-2 text-[12px] leading-snug text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default PushNotificationToggle;
