import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {formatDistanceToNowStrict} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {brokerSyncService} from '@/server/api/api';
import {useSubscription} from '@/hooks/useSubscription';
import {
  ACCENT_SMALL_BUTTON_CLASS,
  ACCENT_SMALL_BUTTON_STYLE,
  CARD_STYLE,
  SettingsCardHeader,
  badgeStyle,
  type BadgeSeverity,
} from './settings-ui';

export interface BrokerConnection {
  id: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  lastError?: string | null;
}

// Mesmos ids de SyncAccounts; a sigla segue o padrão curto do handoff (XP, CLR, BNB).
const PROVIDERS: Record<string, {name: string; badge: string}> = {
  b3: {name: 'B3', badge: 'B3'},
  btg: {name: 'BTG Pactual', badge: 'BTG'},
  xp: {name: 'XP Investimentos', badge: 'XP'},
  clear: {name: 'Clear', badge: 'CLR'},
  rico: {name: 'Rico', badge: 'RCO'},
  nuinvest: {name: 'NuInvest', badge: 'NU'},
  binance: {name: 'Binance', badge: 'BNB'},
  coinbase: {name: 'Coinbase', badge: 'CB'},
  mercadobitcoin: {name: 'Mercado Bitcoin', badge: 'MB'},
  bitso: {name: 'Bitso', badge: 'BTS'},
};

const STATUS: Record<BrokerConnection['status'], {label: string; severity: BadgeSeverity}> = {
  connected: {label: 'Ativa', severity: 'ok'},
  error: {label: 'Atenção', severity: 'warn'},
  disconnected: {label: 'Inativa', severity: 'info'},
};

function describeConnection(connection: BrokerConnection): string {
  if (connection.status === 'error') return 'falha na última sincronização';
  if (connection.status === 'disconnected') return 'desconectada';
  if (!connection.lastSync) return 'aguardando a primeira sincronização';
  const distance = formatDistanceToNowStrict(new Date(connection.lastSync), {locale: ptBR});
  return `última sincronização há ${distance}`;
}

/**
 * Sincronização com corretora é exclusiva do plano Pro: fora dele o card só
 * convida para o upgrade e não consulta conexões.
 */
export function ConnectedAccountsCard() {
  const {hasBrokerSync, isLoading: planLoading} = useSubscription();
  const {data: connections = [], isLoading} = useQuery<BrokerConnection[]>({
    enabled: hasBrokerSync,
    // Mesma chave de SyncAccounts: conectar lá já atualiza este card.
    queryKey: ['broker-connections'],
    queryFn: async () => {
      try {
        const response = await brokerSyncService.getConnections();
        return response.data || [];
      } catch {
        return [];
      }
    },
  });

  if (!planLoading && !hasBrokerSync) {
    return (
      <section style={CARD_STYLE} data-testid="connected-accounts-upsell">
        <SettingsCardHeader
          title="Contas conectadas"
          subtitle="Disponível no plano Pro"
          action={
            <Link to="/plans" className={ACCENT_SMALL_BUTTON_CLASS} style={ACCENT_SMALL_BUTTON_STYLE}>
              Ver planos
            </Link>
          }
        />
        <div style={{padding: '9.8px 16.8px 14px', fontSize: 12, color: 'var(--color-neutral-500)', lineHeight: 1.5}}>
          No Pro, sua carteira sincroniza direto com a corretora. No seu plano, importe a nota de corretagem ou o extrato da B3 em Adicionar ativo.
        </div>
      </section>
    );
  }

  const subtitle = isLoading || planLoading
    ? 'Carregando conexões…'
    : connections.length === 0
      ? 'Nenhuma conexão configurada'
      : `${connections.length} ${connections.length === 1 ? 'conexão configurada' : 'conexões configuradas'}`;

  return (
    <section style={CARD_STYLE}>
      <SettingsCardHeader
        title="Contas conectadas"
        subtitle={subtitle}
        action={
          <Link to="/sync-accounts" className={ACCENT_SMALL_BUTTON_CLASS} style={ACCENT_SMALL_BUTTON_STYLE}>
            Conectar corretora
          </Link>
        }
      />
      <div style={{padding: '5.6px 0'}}>
        {!isLoading && connections.length === 0 ? (
          <div style={{padding: '9.8px 16.8px', fontSize: 12, color: 'var(--color-neutral-500)', lineHeight: 1.5}}>
            Conecte uma corretora ou exchange para sincronizar sua carteira automaticamente.
          </div>
        ) : null}
        {connections.map((connection) => {
          const provider = PROVIDERS[connection.provider] ?? {
            name: connection.provider,
            badge: connection.provider.slice(0, 3).toUpperCase(),
          };
          const status = STATUS[connection.status] ?? STATUS.disconnected;
          return (
            <div key={connection.id ?? connection.provider} style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '9.8px 16.8px'}}>
              <div
                aria-hidden="true"
                style={{width: 30, height: 30, borderRadius: 6, border: '1px solid var(--hair)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 600, color: 'var(--color-neutral-300)', background: 'rgba(var(--rgb-bg),0.6)'}}>
                {provider.badge}
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 12.5, fontWeight: 600}}>{provider.name}</div>
                <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)'}}>{describeConnection(connection)}</div>
              </div>
              <span style={badgeStyle(status.severity)}>{status.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
