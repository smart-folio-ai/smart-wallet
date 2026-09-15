import {useReducer, type CSSProperties} from 'react';
import {Link} from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import useAppToast from '@/hooks/use-app-toast';
import {syncErrorMessage, useConnectExchange} from '@/hooks/useBrokerSync';
import {EXCHANGES, exchangeName, type ExchangeId} from '@/services/accounts/sync-sources';

export type ConnectTab = 'b3' | 'token';

const inputStyle: CSSProperties = {
  height: 38,
  padding: '0 11.2px',
  border: '1px solid var(--hair)',
  borderRadius: 8,
  background: 'rgba(var(--rgb-bg),0.6)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  outline: 'none',
};

const noticeStyle: CSSProperties = {
  display: 'flex',
  gap: 8.4,
  border: '1px solid rgba(152,160,171,0.28)',
  borderRadius: 8,
  background: 'rgba(152,160,171,0.10)',
  padding: '11.2px 14px',
};

interface Form {
  tab: ConnectTab;
  provider: ExchangeId;
  apiKey: string;
  apiSecret: string;
  apiPassphrase: string;
}

const reducer = (state: Form, patch: Partial<Form>): Form => ({...state, ...patch});

/**
 * Modal "Conectar conta" do handoff. A aba B3 leva à importação de arquivos
 * (a B3 não oferece consulta de custódia por CPF para terceiros); a aba de
 * token conecta as exchanges que o server sincroniza, somente leitura.
 */
export function ConnectAccountModal({
  open,
  onOpenChange,
  initialTab,
  initialProvider,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab: ConnectTab;
  initialProvider?: ExchangeId;
}) {
  const toast = useAppToast();
  const connect = useConnectExchange();
  const [form, update] = useReducer(reducer, {
    tab: initialTab,
    provider: initialProvider ?? 'binance',
    apiKey: '',
    apiSecret: '',
    apiPassphrase: '',
  });
  const exchange = EXCHANGES.find((item) => item.id === form.provider)!;
  const sourceLabel = form.tab === 'b3' ? 'B3' : exchange.name;

  const submit = () => {
    if (!form.apiKey.trim() || !form.apiSecret.trim()) {
      toast.error('Campos obrigatórios', 'Cole a chave de API e o secret.');
      return;
    }
    connect.mutate(
      {
        provider: form.provider,
        apiKey: form.apiKey.trim(),
        apiSecret: form.apiSecret.trim(),
        ...(form.apiPassphrase.trim() ? {apiPassphrase: form.apiPassphrase.trim()} : {}),
      },
      {
        onSuccess: (result) => {
          toast.success(`${exchangeName(form.provider)} conectada`, `${result?.syncedAssets ?? 0} ativos atualizados na sua carteira.`);
          onOpenChange(false);
        },
        onError: (error) => toast.error('Não foi possível conectar', syncErrorMessage(error)),
      },
    );
  };

  const tabs: {id: ConnectTab; label: string; icon: string}[] = [
    {id: 'b3', label: 'B3 · arquivo', icon: 'ph ph-bank'},
    {id: 'token', label: 'Corretora/exchange · token', icon: 'ph ph-key'},
  ];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay style={{position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(var(--rgb-deep),0.72)', backdropFilter: 'blur(6px)'}} />
        <div style={{position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, pointerEvents: 'none'}}>
          <DialogPrimitive.Content
            aria-describedby="connect-account-description"
            style={{pointerEvents: 'auto', width: '100%', maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', border: '1px solid rgba(152,160,171,0.30)', borderRadius: 8, background: 'linear-gradient(160deg, rgba(var(--rgb-accent-deep),0.36) 0%, rgba(var(--rgb-surf-2),0.98) 44%), var(--surf-2)', boxShadow: 'var(--shadow-lg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)'}}>
            <div style={{padding: '16.8px 22.4px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'flex-start', gap: 11.2}}>
              <div style={{width: 32, height: 32, borderRadius: 8, background: 'var(--grad-violet)', display: 'grid', placeItems: 'center', flexShrink: 0}}>
                <i className="ph-fill ph-plugs-connected" style={{fontSize: 16, color: 'var(--sunk)'}} aria-hidden />
              </div>
              <div style={{flex: 1}}>
                <DialogPrimitive.Title style={{fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em', margin: 0}}>
                  Conectar conta · {sourceLabel}
                </DialogPrimitive.Title>
                <div id="connect-account-description" style={{fontSize: 12, color: 'var(--color-neutral-400)', marginTop: 3}}>
                  Acesso somente leitura — nenhuma conexão pode movimentar dinheiro ou enviar ordens.
                </div>
              </div>
              <DialogPrimitive.Close
                aria-label="Fechar"
                className="hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)]"
                style={{width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--hair)', background: 'transparent', color: 'var(--color-neutral-400)', cursor: 'pointer', display: 'grid', placeItems: 'center'}}>
                <i className="ph ph-x" style={{fontSize: 14}} aria-hidden />
              </DialogPrimitive.Close>
            </div>

            <div style={{padding: '16.8px 22.4px 0'}}>
              <div role="tablist" style={{display: 'flex', gap: 4, padding: 3, border: '1px solid var(--hair)', borderRadius: 9, background: 'rgba(var(--rgb-bg),0.6)'}}>
                {tabs.map((tab) => {
                  const active = form.tab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => update({tab: tab.id})}
                      style={{flex: 1, height: 32, borderRadius: 7, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, ...(active ? {background: 'rgba(152,160,171,0.20)', color: 'var(--color-accent-100)', boxShadow: 'inset 0 0 0 1px rgba(152,160,171,0.45)'} : {background: 'transparent', color: 'var(--color-neutral-400)'})}}>
                      <i className={tab.icon} style={{fontSize: 14}} aria-hidden />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{padding: '16.8px 22.4px', display: 'flex', flexDirection: 'column', gap: 14}}>
              {form.tab === 'b3' ? (
                <>
                  <div style={noticeStyle}>
                    <i className="ph ph-info" style={{fontSize: 15, color: 'var(--color-accent-200)', marginTop: 1}} aria-hidden />
                    <div style={{fontSize: 12, color: 'var(--color-neutral-300)', lineHeight: 1.55}}>
                      A B3 concentra a custódia de todas as corretoras. Baixe os relatórios na Área do Investidor e importe aqui: posições, negociações, proventos recebidos e eventos a receber entram na carteira. Disponível em todos os planos.
                    </div>
                  </div>
                  <ol style={{margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5.6, fontSize: 12, color: 'var(--color-neutral-300)', lineHeight: 1.5}}>
                    <li>Entre em investidor.b3.com.br com sua conta gov.br</li>
                    <li>Em Extratos e Relatórios, baixe Posição, Movimentação, Negociação e Eventos (Excel)</li>
                    <li>Importe os arquivos em Adicionar ativo — importar de novo só atualiza</li>
                  </ol>
                </>
              ) : (
                <>
                  <div style={noticeStyle}>
                    <i className="ph ph-info" style={{fontSize: 15, color: 'var(--color-accent-200)', marginTop: 1}} aria-hidden />
                    <div style={{fontSize: 12, color: 'var(--color-neutral-300)', lineHeight: 1.55}}>
                      Gere uma chave de API com permissão <b>somente leitura</b> na sua exchange — nunca habilite saque ou envio de ordens. A chave é cifrada com AES-256 e você pode revogá-la quando quiser.
                    </div>
                  </div>
                  <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
                    <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>Corretora ou exchange</span>
                    <select aria-label="Corretora ou exchange" value={form.provider} onChange={(e) => update({provider: e.target.value as ExchangeId})} style={inputStyle}>
                      {EXCHANGES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
                    <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>Chave de API (token)</span>
                    <input aria-label="Chave de API" type="password" autoComplete="off" placeholder="Cole a API key" value={form.apiKey} onChange={(e) => update({apiKey: e.target.value})} style={inputStyle} />
                  </label>
                  <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
                    <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>Secret</span>
                    <input aria-label="Secret" type="password" autoComplete="off" placeholder="Cole o secret da chave" value={form.apiSecret} onChange={(e) => update({apiSecret: e.target.value})} style={inputStyle} />
                  </label>
                  {exchange.needsPassphrase && (
                    <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
                      <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>Passphrase (se exigida pela instituição)</span>
                      <input aria-label="Passphrase" type="password" autoComplete="off" placeholder="Opcional" value={form.apiPassphrase} onChange={(e) => update({apiPassphrase: e.target.value})} style={inputStyle} />
                    </label>
                  )}
                </>
              )}
            </div>

            <div style={{padding: '14px 22.4px', borderTop: '1px solid var(--hair-soft)', display: 'flex', gap: 8.4, justifyContent: 'flex-end'}}>
              <DialogPrimitive.Close
                className="hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)]"
                style={{height: 36, padding: '0 14px', borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--hair)', background: 'transparent', color: 'var(--color-neutral-300)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer'}}>
                Cancelar
              </DialogPrimitive.Close>
              {form.tab === 'b3' ? (
                <Link
                  to="/add-asset"
                  onClick={() => onOpenChange(false)}
                  className="hover:brightness-[1.08]"
                  style={{height: 36, padding: '0 16.8px', borderRadius: 8, background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', textDecoration: 'none'}}>
                  Importar arquivos da B3
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={connect.isPending}
                  className="hover:brightness-[1.08] disabled:opacity-60"
                  style={{height: 36, padding: '0 16.8px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'}}>
                  {connect.isPending ? 'Conectando…' : `Conectar ${exchange.name}`}
                </button>
              )}
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
