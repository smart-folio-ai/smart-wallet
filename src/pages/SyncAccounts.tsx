import {useState, type CSSProperties} from 'react';
import {Link} from 'react-router-dom';
import {badgeStyle, type BadgeSeverity} from '@/components/shared/badge-style';
import {ConnectAccountModal, type ConnectTab} from '@/components/accounts/ConnectAccountModal';
import {CpfSyncComingSoonModal} from '@/components/accounts/CpfSyncComingSoonModal';
import useAppToast from '@/hooks/use-app-toast';
import {useSubscription} from '@/hooks/useSubscription';
import {
  syncErrorMessage,
  useBrokerConnections,
  useBrokerUploads,
  useDisconnectExchange,
  useSyncExchange,
} from '@/hooks/useBrokerSync';
import {
  EXCHANGES,
  buildSyncLog,
  connectionStatus,
  relativeTime,
  syncLogCsv,
  type ExchangeId,
  type ExchangeSource,
} from '@/services/accounts/sync-sources';

const SUPPORT_EMAIL = 'suporte@trackerr.com.br';

const neutralBadge: CSSProperties = {
  flexShrink: 0,
  border: '1px solid var(--hair)',
  borderRadius: 6,
  padding: '3px 8px',
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: '0.02em',
  whiteSpace: 'nowrap',
  color: 'var(--color-neutral-400)',
};

const statusBadge = (severity: BadgeSeverity | 'neutral') => (severity === 'neutral' ? neutralBadge : badgeStyle(severity));

const formatCpf = (value: string) => {
  const digits = value.replace(/D/g, '').slice(0, 11);
  return digits
    .replace(/(d{3})(d)/, '$1.$2')
    .replace(/(d{3})(d)/, '$1.$2')
    .replace(/(d{3})(d{1,2})$/, '$1-$2');
};

const ctaStyle = (primary: boolean): CSSProperties => ({
  height: 34,
  borderRadius: 8,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: primary ? 600 : 500,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  ...(primary
    ? {border: 'none', background: 'var(--grad-ember)', color: '#17140b'}
    : {border: '1px solid var(--color-accent-700)', background: 'transparent', color: 'var(--color-accent-200)'}),
});

interface SourceCardProps {
  name: string;
  initials: string;
  kind: string;
  status: {label: string; severity: BadgeSeverity | 'neutral'};
  what: string;
  steps: string[];
  security: string;
  gradient: string;
  warn?: boolean;
  children: React.ReactNode;
}

function SourceCard({name, initials, kind, status, what, steps, security, gradient, warn, children}: SourceCardProps) {
  return (
    <section
      data-testid="sync-source"
      style={{
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        ...(warn
          ? {border: '1px solid rgba(240,179,46,0.34)', background: 'linear-gradient(180deg, rgba(240,179,46,0.08), rgba(var(--rgb-surf-2),0.9))'}
          : {border: '1px solid var(--hair)', background: 'var(--nk-card)'}),
      }}>
      <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', gap: 11.2}}>
        <div aria-hidden style={{width: 32, height: 32, flexShrink: 0, borderRadius: 8, background: gradient, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--sunk)'}}>
          {initials}
        </div>
        <div style={{flex: 1, minWidth: 0}}>
          <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0}}>{name}</h2>
          <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2}}>{kind}</div>
        </div>
        <span style={statusBadge(status.severity)}>{status.label}</span>
      </div>
      <div style={{padding: '14px 16.8px', display: 'flex', flexDirection: 'column', gap: 11.2, flex: 1}}>
        <div style={{fontSize: 12, color: 'var(--color-neutral-400)', lineHeight: 1.55}}>{what}</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
          {steps.map((step, index) => (
            <div key={step} style={{display: 'flex', gap: 8.4, fontSize: 11.5, color: 'var(--color-neutral-300)', lineHeight: 1.45}}>
              <span style={{width: 15, height: 15, flexShrink: 0, borderRadius: 4, background: 'rgba(152,160,171,0.16)', border: '1px solid rgba(152,160,171,0.32)', color: 'var(--color-accent-100)', fontSize: 9, fontWeight: 700, display: 'grid', placeItems: 'center'}}>
                {index + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 8.4, fontSize: 10.5, color: 'var(--color-neutral-600)', paddingTop: 8.4, borderTop: '1px solid var(--hair-soft)', marginTop: 'auto'}}>
          <i className="ph ph-lock-simple" style={{fontSize: 12, color: 'var(--pos)'}} aria-hidden />
          <span>{security}</span>
        </div>
        {children}
      </div>
    </section>
  );
}

/**
 * Gancho para a sincronização automática via CPF — ainda não existe (a B3
 * não abre consulta de custódia por CPF para terceiros hoje), mas fica
 * visível e convidativo para quem for procurar, com aviso claro de "em
 * breve" em vez de escondido ou fingindo que funciona.
 */
function CpfSyncHook() {
  const [cpf, setCpf] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        marginTop: 4,
        borderRadius: 8,
        padding: 1,
        background: 'linear-gradient(90deg, var(--cy), var(--pos), var(--cy))',
        backgroundSize: '200% 100%',
        animation: 'cpf-sync-glow 3.5s ease-in-out infinite',
      }}>
      <div style={{borderRadius: 7, background: 'var(--nk-card)', padding: 11.2, display: 'flex', flexDirection: 'column', gap: 8.4}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
          <i className="ph-fill ph-sparkle" style={{fontSize: 13, color: '#9fe4fb'}} aria-hidden />
          <span style={{fontSize: 11.5, fontWeight: 600, color: 'var(--color-neutral-100)', flex: 1}}>Sincronizar via CPF</span>
          <span
            style={{
              flexShrink: 0,
              borderRadius: 999,
              padding: '2px 8px',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#17140b',
              background: 'linear-gradient(90deg, var(--cy), var(--pos))',
            }}>
            Em breve
          </span>
        </div>
        <div style={{display: 'flex', gap: 6.4}}>
          <input
            aria-label="CPF"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            style={{flex: 1, height: 32, padding: '0 9.8px', border: '1px solid var(--hair)', borderRadius: 7, background: 'rgba(var(--rgb-bg),0.6)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none'}}
          />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="hover:brightness-110"
            style={{height: 32, padding: '0 11.2px', borderRadius: 7, border: 'none', background: 'linear-gradient(90deg, var(--cy), var(--pos))', color: '#17140b', fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'}}>
            Sincronizar
          </button>
        </div>
      </div>
      <style>{'@keyframes cpf-sync-glow { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }'}</style>
      <CpfSyncComingSoonModal open={open} onOpenChange={setOpen} />
    </div>
  );
}

function ExchangeCard({exchange, canSync, onConnect}: {exchange: ExchangeSource; canSync: boolean; onConnect: (provider: ExchangeId) => void}) {
  const toast = useAppToast();
  const {data: connections = []} = useBrokerConnections(canSync);
  const sync = useSyncExchange();
  const disconnect = useDisconnectExchange();
  const connection = connections.find((item) => item.provider === exchange.id);
  const status = canSync ? connectionStatus(connection) : {label: 'Plano Pro', severity: 'info' as const};
  const needsKey = connection?.status === 'error';

  let cta: React.ReactNode;
  if (!canSync) {
    cta = (
      <Link to="/plans" style={ctaStyle(false)}>
        Disponível no Pro
      </Link>
    );
  } else if (connection && !needsKey) {
    cta = (
      <div style={{display: 'flex', gap: 8.4}}>
        <button
          type="button"
          disabled={sync.isPending}
          onClick={() =>
            sync.mutate(exchange.id, {
              onSuccess: (result) => toast.success('Sincronização concluída', `${result?.syncedAssets ?? 0} ativos de ${exchange.name} atualizados.`),
              onError: (error) => toast.error('Não foi possível sincronizar', syncErrorMessage(error)),
            })
          }
          style={{...ctaStyle(false), flex: 1}}>
          {sync.isPending ? 'Sincronizando…' : 'Sincronizar agora'}
        </button>
        <button
          type="button"
          aria-label={`Desconectar ${exchange.name}`}
          disabled={disconnect.isPending}
          onClick={() =>
            disconnect.mutate(exchange.id, {
              onSuccess: () => toast.success('Conta desconectada', `${exchange.name} não será mais lida. O histórico fica na carteira.`),
              onError: () => toast.error('Não foi possível desconectar', 'Tente novamente em instantes.'),
            })
          }
          className="hover:text-[color:var(--neg)]"
          style={{width: 34, height: 34, borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-400)', cursor: 'pointer', display: 'grid', placeItems: 'center'}}>
          <i className="ph ph-plugs" style={{fontSize: 14}} aria-hidden />
        </button>
      </div>
    );
  } else {
    cta = (
      <button type="button" onClick={() => onConnect(exchange.id)} style={ctaStyle(needsKey)}>
        {needsKey ? 'Atualizar chave' : `Conectar ${exchange.name}`}
      </button>
    );
  }

  return (
    <SourceCard
      name={exchange.name}
      initials={exchange.initials}
      kind={exchange.kind}
      status={status}
      what={exchange.what}
      steps={exchange.steps}
      security={exchange.security}
      gradient={needsKey ? 'linear-gradient(90deg, var(--warn), var(--neg))' : 'linear-gradient(90deg, var(--ac), var(--cy))'}
      warn={needsKey}>
      {cta}
    </SourceCard>
  );
}

function downloadCsv(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], {type: 'text/csv;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Contas conectadas — bloco `isAccounts` de design_handoff_trackerr/Trackerr App.dc.html. */
export default function SyncAccounts() {
  const {hasBrokerSync, isLoading: planLoading} = useSubscription();
  const connections = useBrokerConnections(hasBrokerSync);
  const uploads = useBrokerUploads();
  const [modal, setModal] = useState<{open: boolean; tab: ConnectTab; provider?: ExchangeId}>({open: false, tab: 'b3'});

  const list = hasBrokerSync ? connections.data ?? [] : [];
  const active = list.filter((item) => item.status === 'connected').length;
  const pending = list.filter((item) => item.status === 'error').length;
  const lastRead = list
    .map((item) => item.lastSync)
    .filter(Boolean)
    .sort()
    .at(-1);
  const log = buildSyncLog(list, uploads.data ?? []);

  const openConnect = (tab: ConnectTab, provider?: ExchangeId) => setModal({open: true, tab, provider});

  const stats = [
    {label: 'Contas conectadas', value: hasBrokerSync ? String(active) : 'Plano Pro', color: 'var(--color-neutral-100)'},
    {label: 'Última leitura', value: relativeTime(lastRead), color: 'var(--pos)'},
    {label: 'Ações pendentes', value: pending ? `${pending} ${pending === 1 ? 'reautenticação' : 'reautenticações'}` : 'nenhuma', color: pending ? 'var(--warn)' : 'var(--color-neutral-100)'},
  ];

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      <section style={{position: 'relative', border: '1px solid rgba(76,201,240,0.30)', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(115deg, rgba(76,201,240,0.24) 0%, rgba(152,160,171,0.14) 52%, rgba(var(--rgb-surf-2),0.92) 100%), var(--surf-2)'}}>
        <div className="grid grid-cols-1 items-center gap-[22.4px] p-[22.4px] lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div style={{fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9fe4fb'}}>Sincronização</div>
            <h1 style={{fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', margin: '8.4px 0 0'}}>Conecte uma vez, nunca digite de novo</h1>
            <div style={{fontSize: 12.5, color: 'var(--color-neutral-300)', marginTop: 8.4, maxWidth: 520, lineHeight: 1.6}}>
              O Trackerr lê posições, operações e proventos direto da fonte. Nenhuma conexão dá permissão para movimentar dinheiro ou enviar ordens — o acesso é somente leitura.
            </div>
            <button
              type="button"
              onClick={() => openConnect(hasBrokerSync ? 'token' : 'b3')}
              className="hover:brightness-[1.08]"
              style={{marginTop: 14, height: 36, padding: '0 16.8px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6}}>
              <i className="ph ph-plus-circle" style={{fontSize: 15}} aria-hidden />
              Conectar nova conta
            </button>
          </div>
          <div style={{border: '1px solid rgba(var(--rgb-line),0.14)', borderRadius: 8, padding: '14px 16.8px', background: 'rgba(var(--rgb-bg),0.58)', backdropFilter: 'blur(8px)'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8.4}}>
              {stats.map((stat) => (
                <div key={stat.label} style={{display: 'flex', alignItems: 'baseline', gap: 11.2, fontSize: 12}}>
                  <span style={{flex: 1, color: 'var(--color-neutral-500)'}}>{stat.label}</span>
                  <span style={{fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: stat.color}}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-[16.8px] md:grid-cols-2 xl:grid-cols-3">
        <SourceCard
          name="B3 · Área do investidor"
          initials="B3"
          kind="Custódia central · todas as corretoras"
          status={{label: 'Por arquivo', severity: 'info'}}
          what="A B3 traz tudo que está na sua custódia, independente da corretora: ações, FIIs, BDRs, ETFs e Tesouro Direto."
          steps={['Entre em investidor.b3.com.br com sua conta gov.br', 'Baixe Posição, Movimentação, Negociação e Eventos em Excel', 'Importe os arquivos — importar de novo só atualiza']}
          security="Disponível em todos os planos · arquivo validado"
          gradient="linear-gradient(90deg, var(--cy), var(--pos))">
          <button type="button" onClick={() => openConnect('b3')} style={ctaStyle(false)}>
            Importar arquivos da B3
          </button>
          <CpfSyncHook />
        </SourceCard>

        {!planLoading &&
          EXCHANGES.map((exchange) => (
            <ExchangeCard key={exchange.id} exchange={exchange} canSync={hasBrokerSync} onConnect={(provider) => openConnect('token', provider)} />
          ))}

        <SourceCard
          name="Outra exchange ou banco"
          initials="+"
          kind="Kraken, Bybit, Nubank, Inter…"
          status={{label: 'Sob demanda', severity: 'info'}}
          what="Não achou a sua? Diga qual é: novas integrações entram por demanda."
          steps={['Informe a instituição e o tipo de ativo', 'Nosso time avalia e responde por e-mail', 'Enquanto isso, importe por arquivo ou lance manual']}
          security="Avaliação de segurança antes de qualquer integração"
          gradient="linear-gradient(90deg, var(--ac), var(--cy))">
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Pedido de integração')}`} style={ctaStyle(false)}>
            Pedir integração
          </a>
        </SourceCard>
      </div>

      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 11.2}}>
          <div>
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0}}>Histórico de sincronização</h2>
            <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2}}>Toda leitura fica registrada para auditoria</div>
          </div>
          <button
            type="button"
            disabled={!log.length}
            onClick={() => downloadCsv(syncLogCsv(log), `historico-sincronizacao-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)] disabled:opacity-50"
            style={{height: 30, padding: '0 11.2px', borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--hair)', background: 'transparent', color: 'var(--color-neutral-300)', fontFamily: 'var(--font-body)', fontSize: 11.5, cursor: 'pointer'}}>
            Exportar log CSV
          </button>
        </div>
        <div style={{padding: '5.6px 0'}}>
          {log.length === 0 && (
            <div style={{padding: '9.8px 16.8px', fontSize: 12, color: 'var(--color-neutral-500)'}}>Nenhuma leitura ou importação ainda.</div>
          )}
          {log.slice(0, 20).map((entry) => (
            <div key={entry.key} data-testid="sync-log-entry" style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '9.8px 16.8px'}}>
              <i className={entry.icon} style={{fontSize: 15, color: entry.color}} aria-hidden />
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 12.5, color: 'var(--color-neutral-200)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{entry.label}</div>
                <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2}}>{entry.meta}</div>
              </div>
              <span style={{fontSize: 11, color: 'var(--color-neutral-600)', fontVariantNumeric: 'tabular-nums'}}>{relativeTime(entry.at)}</span>
            </div>
          ))}
        </div>
      </section>

      {modal.open && (
        <ConnectAccountModal
          key={`${modal.tab}-${modal.provider ?? ''}`}
          open
          onOpenChange={(open) => !open && setModal((current) => ({...current, open: false}))}
          initialTab={hasBrokerSync ? modal.tab : 'b3'}
          initialProvider={modal.provider}
        />
      )}
    </div>
  );
}
