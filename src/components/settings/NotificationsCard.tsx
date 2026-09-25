import {Switch} from '@/components/ui/switch';
import {
  useAccountSettings,
  useSaveEmailNotifications,
} from '@/hooks/useAccountSettings';
import {PushNotificationToggle} from './PushNotificationToggle';
import {PortfolioDigestToggle} from './PortfolioDigestToggle';
import {CARD_STYLE, SettingsCardHeader} from './settings-ui';

/**
 * O handoff não tem bloco de notificações; mantém o desenho dos demais cards.
 *
 * Só existem duas preferências reais: `preferences.notifications` do perfil
 * (um boolean no servidor) e a assinatura Web Push do navegador. Os antigos
 * "Alertas de mercado" e "Atualizações de portfólio" nunca eram persistidos.
 */
export function NotificationsCard() {
  const {data} = useAccountSettings();
  const save = useSaveEmailNotifications();

  // Enquanto salva, mostra o valor pedido em vez de voltar ao anterior até o refetch.
  const emailEnabled = save.isPending
    ? save.variables.enabled
    : (data?.emailNotifications ?? true);

  return (
    <section style={CARD_STYLE}>
      <SettingsCardHeader title="Notificações" subtitle="Aplicadas assim que você altera" />
      <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 14}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 11.2}}>
          <div>
            <label htmlFor="email-notifications" style={{fontSize: 12.5, color: 'var(--color-neutral-200)'}}>
              Notificações por e-mail
            </label>
            <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2, lineHeight: 1.4}}>
              Resumos e avisos importantes da sua conta
            </div>
          </div>
          <Switch
            id="email-notifications"
            checked={emailEnabled}
            disabled={!data || save.isPending}
            onCheckedChange={(enabled) => data && save.mutate({settings: data, enabled})}
          />
        </div>
        <PushNotificationToggle />
        <PortfolioDigestToggle />
      </div>
    </section>
  );
}
