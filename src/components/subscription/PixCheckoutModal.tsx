import {useEffect, useReducer, useState, type CSSProperties} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import useAppToast from '@/hooks/use-app-toast';
import PixPaymentService, {classifyPixError, type PixInterval} from '@/services/pix';
import {formatCountdown, maskCpf, pixReducer, type PixStep} from './pix-checkout-state';

/**
 * Pagamento por PIX (TRA-195). O handoff não tem esta tela: a casca (overlay,
 * conteúdo, título, botões, campo) repete a de `ConnectAccountModal` e
 * `CpfSyncComingSoonModal`, que já seguem o `Trackerr App.dc.html`.
 *
 * O modal não libera plano nenhum. Ele emite a cobrança, mostra o QR e
 * acompanha o estado por polling; quem libera é o webhook do Asaas no server.
 */
export interface PixCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {id: string; name: string} | null;
  interval: PixInterval;
  onManageSubscription: () => void;
}

const POLL_INTERVAL_MS = 5000;

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
  fontVariantNumeric: 'tabular-nums',
};

const secondaryButton: CSSProperties = {
  height: 36,
  padding: '0 14px',
  borderRadius: 8,
  border: '1px solid var(--hair)',
  background: 'transparent',
  color: 'var(--color-neutral-300)',
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  cursor: 'pointer',
};

// Botão primário dos modais do handoff (ver `ConnectAccountModal`).
const primaryButton: CSSProperties = {
  height: 36,
  padding: '0 16.8px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--grad-violet)',
  color: 'var(--sunk)',
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
};

const currency = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'});
const longDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', year: 'numeric'}) : '';

/** Relógio de 1 s para a contagem regressiva — só enquanto há QR na tela. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

export function PixCheckoutModal({open, onOpenChange, plan, interval, onManageSubscription}: PixCheckoutModalProps) {
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [step, dispatch] = useReducer(pixReducer, {kind: 'creating'} as PixStep);
  const [cpf, setCpf] = useState('');

  const checkout = useMutation({
    mutationFn: (withCpf?: string) => PixPaymentService.checkout(plan!.id, interval, withCpf),
    onSuccess: (charge) => dispatch({type: 'charge_created', charge}),
    onError: (error) => dispatch({type: 'checkout_failed', ...toFailure(error)}),
  });

  // Abre o modal → emite (ou reaproveita, no server) a cobrança.
  const mutate = checkout.mutate;
  useEffect(() => {
    if (!open || !plan) return;
    dispatch({type: 'restart'});
    setCpf('');
    mutate(undefined);
  }, [open, plan, interval, mutate]);

  const chargeId = step.kind === 'awaiting' ? step.charge.chargeId : null;
  const polling = useQuery({
    queryKey: ['pix-charge', chargeId],
    queryFn: () => PixPaymentService.getCharge(chargeId!),
    enabled: open && chargeId !== null,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (polling.data) dispatch({type: 'charge_updated', charge: polling.data});
  }, [polling.data]);

  useEffect(() => {
    if (step.kind === 'paid') {
      void queryClient.invalidateQueries({queryKey: ['current-subscription']});
    }
  }, [step.kind, queryClient]);

  const now = useNow(open && step.kind === 'awaiting');
  const expiresAt = step.kind === 'awaiting' ? step.charge.expiresAt : undefined;
  useEffect(() => {
    if (expiresAt && new Date(expiresAt).getTime() <= now) dispatch({type: 'expired'});
  }, [expiresAt, now]);

  const copyCode = async (payload: string) => {
    try {
      await navigator.clipboard.writeText(payload);
      toast.success('Código PIX copiado', 'Cole no app do seu banco, na opção PIX copia e cola.');
    } catch {
      toast.error('Não foi possível copiar', 'Selecione o código e copie manualmente.');
    }
  };

  const cpfDigits = cpf.replace(/\D/g, '');
  const periodLabel = interval === 'year' ? 'anual' : 'mensal';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          style={{position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(var(--rgb-deep),0.72)', backdropFilter: 'blur(6px)'}}
        />
        <div style={{position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: 'none'}}>
          <DialogPrimitive.Content
            aria-describedby="pix-checkout-description"
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: 440,
              border: '1px solid rgba(152,160,171,0.30)',
              borderRadius: 8,
              background: 'linear-gradient(160deg, rgba(var(--rgb-accent-deep),0.36) 0%, rgba(var(--rgb-surf-2),0.98) 44%), var(--surf-2)',
              boxShadow: 'var(--shadow-lg)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-body)',
              overflow: 'hidden',
            }}>
            <div style={{padding: '16.8px 22.4px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', gap: 11.2}}>
              <div
                aria-hidden
                style={{width: 32, height: 32, borderRadius: 8, background: 'rgba(47,214,163,0.14)', border: '1px solid rgba(47,214,163,0.3)', display: 'grid', placeItems: 'center'}}>
                <i className="ph-fill ph-qr-code" style={{fontSize: 16, color: 'var(--pos)'}} />
              </div>
              <div style={{flex: 1, minWidth: 0}}>
                <DialogPrimitive.Title style={{fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', margin: 0}}>
                  Pagar com PIX
                </DialogPrimitive.Title>
                <div id="pix-checkout-description" style={{fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 2}}>
                  {plan ? `Plano ${plan.name} · ${periodLabel}` : ''}
                </div>
              </div>
              <DialogPrimitive.Close
                aria-label="Fechar"
                className="hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)]"
                style={{width: 30, height: 30, borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-400)', cursor: 'pointer', display: 'grid', placeItems: 'center'}}>
                <i className="ph ph-x" style={{fontSize: 14}} aria-hidden />
              </DialogPrimitive.Close>
            </div>

            <div style={{padding: '20px 22.4px', display: 'flex', flexDirection: 'column', gap: 14}}>
              {step.kind === 'creating' && <Status icon="ph ph-circle-notch" spin text="Gerando cobrança PIX…" />}

              {step.kind === 'cpf' && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (cpfDigits.length === 11) checkout.mutate(cpf);
                  }}
                  style={{display: 'flex', flexDirection: 'column', gap: 11.2}}>
                  <p style={{margin: 0, fontSize: 12.5, color: 'var(--color-neutral-400)', lineHeight: 1.55}}>
                    Para emitir PIX, o Banco Central exige o CPF do pagador. Ele é enviado só ao nosso processador de
                    pagamentos e não fica salvo no Trackerr. Nas próximas compras não pediremos de novo.
                  </p>
                  <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
                    <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>CPF</span>
                    <input
                      aria-label="CPF"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(event) => setCpf(maskCpf(event.target.value))}
                      aria-invalid={Boolean(step.error)}
                      style={{...inputStyle, ...(step.error ? {borderColor: 'var(--neg)'} : {})}}
                      autoFocus
                    />
                  </label>
                  {step.error && (
                    <div role="alert" style={{fontSize: 11.5, color: 'var(--neg)'}}>
                      {step.error}
                    </div>
                  )}
                  <div style={{display: 'flex', justifyContent: 'flex-end', gap: 8.4}}>
                    <DialogPrimitive.Close style={secondaryButton}>Cancelar</DialogPrimitive.Close>
                    <button type="submit" disabled={cpfDigits.length !== 11 || checkout.isPending} className="disabled:cursor-not-allowed disabled:opacity-60" style={primaryButton}>
                      {checkout.isPending ? 'Gerando…' : 'Gerar QR code'}
                    </button>
                  </div>
                </form>
              )}

              {step.kind === 'awaiting' && (
                <>
                  <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
                    <span style={{fontSize: 11.5, color: 'var(--color-neutral-500)'}}>Valor</span>
                    <span style={{fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums'}}>
                      {currency.format(step.charge.amount)}
                    </span>
                  </div>
                  {step.charge.qrCodeImage && (
                    <div style={{alignSelf: 'center', padding: 11.2, borderRadius: 8, background: '#fff', border: '1px solid var(--hair)'}}>
                      <img
                        src={`data:image/png;base64,${step.charge.qrCodeImage}`}
                        alt="QR code PIX para pagamento"
                        width={196}
                        height={196}
                        style={{display: 'block'}}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => step.charge.qrCodePayload && copyCode(step.charge.qrCodePayload)}
                    className="hover:bg-[rgba(152,160,171,0.12)]"
                    style={{...secondaryButton, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--color-accent-200)', borderColor: 'var(--color-accent-700)'}}>
                    <i className="ph ph-copy" aria-hidden /> Copiar código PIX
                  </button>
                  <Status
                    icon="ph ph-circle-notch"
                    spin
                    text="Aguardando pagamento…"
                    meta={`expira em ${formatCountdown(step.charge.expiresAt, now)}`}
                  />
                  <p style={{margin: 0, fontSize: 11, color: 'var(--color-neutral-600)', lineHeight: 1.5}}>
                    A confirmação chega em segundos depois do pagamento. Pode fechar esta janela: o plano é liberado assim
                    que o banco confirmar.
                  </p>
                </>
              )}

              {step.kind === 'paid' && (
                <div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11.2, padding: '8px 0'}}>
                  <div
                    aria-hidden
                    style={{width: 48, height: 48, borderRadius: 8, background: 'rgba(47,214,163,0.14)', display: 'grid', placeItems: 'center'}}>
                    <i className="ph-fill ph-check-circle" style={{fontSize: 26, color: 'var(--pos)'}} />
                  </div>
                  <div style={{fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 600}}>Pagamento confirmado</div>
                  <div style={{fontSize: 12.5, color: 'var(--color-neutral-400)'}}>
                    Plano {plan?.name} liberado{step.charge.periodEnd ? ` até ${longDate(step.charge.periodEnd)}` : ''}.
                  </div>
                  <DialogPrimitive.Close style={primaryButton}>Continuar</DialogPrimitive.Close>
                </div>
              )}

              {step.kind === 'expired' && (
                <Notice
                  icon="ph ph-timer"
                  title="O QR code expirou"
                  text="Nenhum valor foi cobrado. Gere um novo código para pagar."
                  action={{label: 'Gerar novo QR code', onClick: () => {
                    dispatch({type: 'restart'});
                    checkout.mutate(undefined);
                  }}}
                />
              )}

              {step.kind === 'error' && (
                <Notice
                  icon={step.errorKind === 'card_active' ? 'ph ph-credit-card' : 'ph ph-warning-circle'}
                  title={
                    step.errorKind === 'card_active'
                      ? 'Você já assina pelo cartão'
                      : step.errorKind === 'unavailable'
                        ? 'PIX indisponível'
                        : 'Não foi possível gerar o PIX'
                  }
                  text={step.message}
                  action={
                    step.errorKind === 'card_active'
                      ? {label: 'Gerenciar assinatura', onClick: onManageSubscription}
                      : step.errorKind === 'generic'
                        ? {label: 'Tentar de novo', onClick: () => {
                            dispatch({type: 'restart'});
                            checkout.mutate(undefined);
                          }}
                        : undefined
                  }
                />
              )}
            </div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function toFailure(error: unknown) {
  const {kind, message} = classifyPixError(error);
  return {errorKind: kind, message};
}

function Status({icon, text, meta, spin}: {icon: string; text: string; meta?: string; spin?: boolean}) {
  return (
    <div
      role="status"
      style={{display: 'flex', alignItems: 'center', gap: 8.4, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--hair-soft)', background: 'rgba(var(--rgb-bg),0.4)', fontSize: 12.5}}>
      <i className={`${icon}${spin ? ' animate-spin' : ''}`} style={{fontSize: 14, color: 'var(--color-accent-300)'}} aria-hidden />
      <span>{text}</span>
      {meta && <span style={{marginLeft: 'auto', fontSize: 11.5, color: 'var(--color-neutral-500)', fontVariantNumeric: 'tabular-nums'}}>{meta}</span>}
    </div>
  );
}

function Notice({icon, title, text, action}: {icon: string; title: string; text: string; action?: {label: string; onClick: () => void}}) {
  return (
    <div role="alert" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, padding: '6px 0'}}>
      <i className={icon} style={{fontSize: 26, color: 'var(--warn)'}} aria-hidden />
      <div style={{fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600}}>{title}</div>
      <div style={{fontSize: 12.5, color: 'var(--color-neutral-400)', lineHeight: 1.55}}>{text}</div>
      <div style={{display: 'flex', gap: 8.4, marginTop: 4}}>
        <DialogPrimitive.Close style={secondaryButton}>Fechar</DialogPrimitive.Close>
        {action && (
          <button type="button" onClick={action.onClick} style={primaryButton}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
