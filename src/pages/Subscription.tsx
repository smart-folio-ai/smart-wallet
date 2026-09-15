import {useMemo, useState, type CSSProperties} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import SubscriptionService from '@/services/subscription';
import Profile from '@/services/profile';
import useAppToast from '@/hooks/use-app-toast';
import {badgeStyle, type BadgeSeverity} from '@/components/shared/badge-style';
import type {CurrentSubscriptionResponse, ISubscription, SubscriptionInvoice} from '@/interface/subscription';
import {configUrlStripePaymentSuccessOrCancel} from '@/utils';
import {cancelUrl, successUrl} from '@/utils/env';
import {normalizePlanPricing} from '@/utils/planPricing';
import {formatCurrency} from '@/utils/formatters';

type PricingPeriod = 'monthly' | 'annual';

const SUPPORT_EMAIL = 'suporte@trackerr.com.br';

const cardStyle: CSSProperties = {border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'};
const thBase: CSSProperties = {padding: '11.2px 16.8px', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', background: 'rgba(var(--rgb-bg),0.5)'};

const longDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'});
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

const INVOICE_STATUS: Record<string, {label: string; severity: BadgeSeverity}> = {
  paid: {label: 'Pago', severity: 'ok'},
  open: {label: 'Em aberto', severity: 'warn'},
  draft: {label: 'Agendado', severity: 'info'},
  uncollectible: {label: 'Não pago', severity: 'neg'},
  void: {label: 'Cancelada', severity: 'info'},
};

interface PlanColumn {
  plan: ISubscription;
  monthlyPrice: number;
  annualPrice: number;
  hasRealAnnualPrice: boolean;
}

function priceLabel(column: PlanColumn, period: PricingPeriod): string {
  if (column.monthlyPrice <= 0) return 'Grátis';
  // Sem preço anual real no Stripe, mostra o mensal: nunca inventa desconto.
  if (period === 'annual' && column.hasRealAnnualPrice) return `${formatCurrency(column.annualPrice)}/ano`;
  return `${formatCurrency(column.monthlyPrice)}/mês`;
}

/** Assinatura — bloco `isPlans` de design_handoff_trackerr/Trackerr App.dc.html. */
export default function Subscription() {
  const toast = useAppToast();
  const [period, setPeriod] = useState<PricingPeriod>('monthly');

  const current = useQuery<CurrentSubscriptionResponse>({queryKey: ['current-subscription'], queryFn: () => SubscriptionService.getCurrentPlan()});
  const plansQuery = useQuery<ISubscription[]>({queryKey: ['plans'], queryFn: () => SubscriptionService.getPlans()});
  const invoices = useQuery<SubscriptionInvoice[]>({queryKey: ['subscription-invoices'], queryFn: () => SubscriptionService.getInvoices()});

  const columns = useMemo<PlanColumn[]>(
    () =>
      (plansQuery.data ?? [])
        .filter((plan) => plan.isActive || plan.isComingSoon)
        .map((plan) => ({plan, ...normalizePlanPricing(plan)}))
        .sort((a, b) => a.monthlyPrice - b.monthlyPrice),
    [plansQuery.data],
  );

  const discountBadge = useMemo(() => {
    const discounts = columns
      .filter((column) => column.hasRealAnnualPrice && column.monthlyPrice > 0)
      .map((column) => 1 - column.annualPrice / (column.monthlyPrice * 12));
    const best = Math.round(Math.max(0, ...discounts) * 100);
    return best > 0 ? `Economize ${best}%` : null;
  }, [columns]);

  const features = useMemo(() => Array.from(new Set(columns.flatMap((column) => column.plan.features))), [columns]);

  const currentPlan = current.data?.plan ?? null;
  const subscription = current.data?.subscription ?? null;
  const currentPlanId = currentPlan?._id ?? null;

  const portal = useMutation({
    mutationFn: async () => {
      const user = await Profile.getProfile();
      return SubscriptionService.createPortalSession(user._id, window.location.href);
    },
    onSuccess: (session) => {
      window.location.href = session.url;
    },
    onError: () => toast.error('Não foi possível abrir o portal', 'Tente novamente em instantes.'),
  });

  const checkout = useMutation({
    mutationFn: async (plan: ISubscription) => {
      const user = await Profile.getProfile();
      return SubscriptionService.createCheckoutSession(
        plan._id,
        user._id,
        configUrlStripePaymentSuccessOrCancel(successUrl),
        configUrlStripePaymentSuccessOrCancel(cancelUrl),
        period,
      );
    },
    onSuccess: (session) => {
      window.location.href = session.url;
    },
    onError: () => toast.error('Não foi possível iniciar o checkout', 'O pagamento está indisponível agora. Tente novamente em instantes.'),
  });

  const subscribe = (plan: ISubscription) => {
    if (plan.isComingSoon || !plan.isActive) {
      toast.info?.('Em breve', 'Este plano estará disponível em breve.');
      return;
    }
    checkout.mutate(plan);
  };

  const planSummary = !currentPlan
    ? 'Você está no plano gratuito. Faça upgrade quando quiser — sem fidelidade.'
    : subscription?.currentPeriodEnd
      ? `${subscription.cancelAtPeriodEnd ? 'Cancelamento agendado' : 'Renovação'} em ${longDate(subscription.currentPeriodEnd)} · cobrança pelo Stripe`
      : 'Assinatura ativa · cobrança pelo Stripe';

  const facts = [
    {label: 'Status', value: subscription ? (subscription.cancelAtPeriodEnd ? 'cancela no fim do período' : subscription.status === 'trialing' ? 'em teste' : 'ativa') : 'gratuito'},
    {label: 'Próxima cobrança', value: subscription?.currentPeriodEnd && !subscription.cancelAtPeriodEnd ? shortDate(subscription.currentPeriodEnd) : '—'},
    {label: 'Cancelamento', value: 'a qualquer momento'},
    {label: 'Arrependimento', value: 'reembolso em até 7 dias'},
  ];

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      <section style={{position: 'relative', border: '1px solid rgba(152,160,171,0.32)', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(112deg, rgba(123,130,144,0.40) 0%, rgba(76,201,240,0.14) 52%, rgba(var(--rgb-surf-2),0.9) 100%), var(--surf-2)'}}>
        <div aria-hidden style={{position: 'absolute', inset: 0, background: 'radial-gradient(480px 220px at 92% -30%, rgba(152,160,171,0.30), rgba(152,160,171,0) 70%)', pointerEvents: 'none'}} />
        <div className="relative grid grid-cols-1 items-center gap-[22.4px] p-[22.4px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div>
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 5.6, border: '1px solid rgba(152,160,171,0.45)', borderRadius: 6, padding: '3px 8px', background: 'rgba(152,160,171,0.18)', fontSize: 10.5, color: 'var(--color-accent-100)', letterSpacing: '0.04em'}}>
              <i className="ph-fill ph-crown-simple" style={{fontSize: 12}} aria-hidden />
              PLANO ATUAL
            </div>
            <h1 style={{fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', margin: '11.2px 0 0'}}>
              {current.isLoading ? '…' : currentPlan?.name ?? 'Essencial'}
            </h1>
            <div style={{fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 5.6, lineHeight: 1.55}}>{planSummary}</div>
            <div style={{display: 'flex', gap: 8.4, marginTop: 16.8, flexWrap: 'wrap'}}>
              {currentPlan ? (
                <button
                  type="button"
                  onClick={() => portal.mutate()}
                  disabled={portal.isPending}
                  className="hover:brightness-[1.08] disabled:opacity-60"
                  style={{height: 34, padding: '0 14px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'}}>
                  {portal.isPending ? 'Abrindo…' : 'Gerenciar assinatura'}
                </button>
              ) : (
                <a
                  href="#comparar-planos"
                  className="hover:brightness-[1.08]"
                  style={{height: 34, padding: '0 14px', borderRadius: 8, background: 'var(--grad-violet)', color: 'var(--sunk)', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', textDecoration: 'none'}}>
                  Ver planos
                </a>
              )}
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Assinatura Trackerr')}`}
                className="hover:border-[color:var(--color-accent-400)] hover:text-[color:var(--color-neutral-100)]"
                style={{height: 34, padding: '0 14px', borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--hair)', color: 'var(--color-neutral-200)', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', textDecoration: 'none'}}>
                Falar com o suporte
              </a>
            </div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 11.2}}>
            {(currentPlan?.features?.length ? currentPlan.features : columns[0]?.plan.features ?? []).slice(0, 4).map((feature) => (
              <div key={feature} style={{border: '1px solid rgba(var(--rgb-line),0.14)', borderRadius: 8, padding: '11.2px 14px', background: 'rgba(var(--rgb-bg),0.58)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 8.4, fontSize: 12, color: 'var(--color-neutral-200)', lineHeight: 1.4}}>
                <i className="ph-fill ph-check-circle" style={{fontSize: 14, color: 'var(--pos)', flexShrink: 0}} aria-hidden />
                {feature}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="comparar-planos" style={cardStyle}>
        <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 11.2, flexWrap: 'wrap'}}>
          <div>
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0}}>Comparar planos</h2>
            <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2}}>Cobrança {period === 'annual' ? 'anual' : 'mensal'} · valores por titular</div>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 11.2}}>
            {discountBadge && <span style={badgeStyle('ok')}>{discountBadge}</span>}
            <div role="group" aria-label="Período de cobrança" style={{display: 'flex', gap: 2.8, padding: 2.8, border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.6)'}}>
              {(['monthly', 'annual'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={period === option}
                  onClick={() => setPeriod(option)}
                  style={{height: 24, padding: '0 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 500, fontFamily: 'var(--font-body)', ...(period === option ? {background: 'rgba(152,160,171,0.20)', color: 'var(--color-accent-200)', boxShadow: 'inset 0 0 0 1px rgba(152,160,171,0.45)'} : {background: 'transparent', color: 'var(--color-neutral-500)'})}}>
                  {option === 'monthly' ? 'Mensal' : 'Anual'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{overflowX: 'auto'}}>
          {plansQuery.isLoading ? (
            <div style={{padding: 16.8, fontSize: 12.5, color: 'var(--color-neutral-500)'}}>Carregando planos…</div>
          ) : columns.length === 0 ? (
            <div style={{padding: 16.8, fontSize: 12.5, color: 'var(--color-neutral-500)'}}>Nenhum plano disponível no momento.</div>
          ) : (
            <table style={{width: '100%', minWidth: 780, borderCollapse: 'collapse', fontSize: 12.5}}>
              <thead>
                <tr>
                  <th style={{...thBase, textAlign: 'left'}}>Recurso</th>
                  {columns.map((column) => {
                    const isCurrent = column.plan._id === currentPlanId;
                    return (
                      <th key={column.plan._id} data-testid="plan-column" style={{...thBase, textAlign: 'center', ...(isCurrent ? {background: 'linear-gradient(180deg, rgba(123,130,144,0.28), rgba(var(--rgb-bg),0.5))', boxShadow: 'inset 0 -2px 0 var(--color-accent-400)'} : {})}}>
                        <div style={{fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', textTransform: 'none', color: 'var(--color-neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6}}>
                          {column.plan.name}
                          {column.plan.isFeatured && <span style={{...badgeStyle('info'), padding: '1px 6px', fontSize: 9.5}}>Popular</span>}
                          {column.plan.isComingSoon && <span style={{...badgeStyle('warn'), padding: '1px 6px', fontSize: 9.5}}>Em breve</span>}
                        </div>
                        <div style={{fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3, textTransform: 'none', letterSpacing: 0, fontVariantNumeric: 'tabular-nums'}}>{priceLabel(column, period)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr key={feature} className="hover:bg-[rgba(152,160,171,0.05)]" style={{borderTop: '1px solid var(--hair-soft)'}}>
                    <td style={{padding: '9.8px 16.8px', color: 'var(--color-neutral-300)'}}>{feature}</td>
                    {columns.map((column) => {
                      const included = column.plan.features.includes(feature);
                      const isCurrent = column.plan._id === currentPlanId;
                      return (
                        <td key={column.plan._id} style={{padding: '9.8px 16.8px', textAlign: 'center', color: included ? (isCurrent ? 'var(--color-accent-200)' : 'var(--color-neutral-300)') : 'var(--color-neutral-700)', fontWeight: included && isCurrent ? 600 : 400, ...(isCurrent ? {background: 'rgba(123,130,144,0.08)'} : {})}}>
                          {included ? '✓' : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr style={{borderTop: '1px solid var(--hair-soft)'}}>
                  <td style={{padding: '11.2px 16.8px', fontSize: 11, color: 'var(--color-neutral-600)'}}>upgrade e downgrade a qualquer momento</td>
                  {columns.map((column) => {
                    const isCurrent = column.plan._id === currentPlanId;
                    const free = column.monthlyPrice <= 0;
                    return (
                      <td key={column.plan._id} style={{padding: '11.2px 16.8px', textAlign: 'center', ...(isCurrent ? {background: 'rgba(123,130,144,0.08)'} : {})}}>
                        {isCurrent ? (
                          <span style={badgeStyle('ok')}>Plano atual</span>
                        ) : free ? (
                          <span style={{fontSize: 11, color: 'var(--color-neutral-600)'}}>{currentPlan ? 'pelo portal' : 'seu plano'}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => subscribe(column.plan)}
                            disabled={checkout.isPending}
                            className="hover:bg-[rgba(152,160,171,0.12)] disabled:opacity-60"
                            style={{height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid var(--color-accent-700)', background: 'transparent', color: 'var(--color-accent-200)', fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 500, cursor: 'pointer'}}>
                            {column.plan.isComingSoon ? 'Em breve' : checkout.isPending && checkout.variables?._id === column.plan._id ? 'Abrindo…' : `Assinar ${column.plan.name}`}
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-[16.8px] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section style={cardStyle}>
          <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)'}}>
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0}}>Faturas</h2>
          </div>
          <div style={{padding: '5.6px 0'}}>
            {invoices.isLoading && <div style={{padding: '9.8px 16.8px', fontSize: 12, color: 'var(--color-neutral-500)'}}>Carregando faturas…</div>}
            {invoices.isError && <div style={{padding: '9.8px 16.8px', fontSize: 12, color: 'var(--neg)'}}>Não foi possível carregar as faturas.</div>}
            {invoices.data?.length === 0 && <div style={{padding: '9.8px 16.8px', fontSize: 12, color: 'var(--color-neutral-500)'}}>Nenhuma fatura ainda.</div>}
            {invoices.data?.map((invoice) => {
              const status = INVOICE_STATUS[invoice.status ?? ''] ?? {label: invoice.status ?? '—', severity: 'info' as const};
              const meta = invoice.paidAt ? `pago em ${shortDate(invoice.paidAt)}` : invoice.dueDate ? `vence em ${shortDate(invoice.dueDate)}` : `emitida em ${shortDate(invoice.createdAt)}`;
              return (
                <div key={invoice.id} data-testid="invoice" style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '9.8px 16.8px'}}>
                  <i className="ph ph-file-pdf" style={{fontSize: 16, color: 'var(--color-neutral-500)'}} aria-hidden />
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{fontSize: 12.5, color: 'var(--color-neutral-200)'}}>
                      {invoice.pdfUrl ? (
                        <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" style={{color: 'inherit'}}>
                          {invoice.description ?? invoice.number ?? 'Fatura'}
                        </a>
                      ) : (
                        invoice.description ?? invoice.number ?? 'Fatura'
                      )}
                    </div>
                    <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)'}}>{meta}</div>
                  </div>
                  <span style={{fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{formatCurrency(invoice.total, invoice.currency.toUpperCase())}</span>
                  <span style={badgeStyle(status.severity)}>{status.label}</span>
                </div>
              );
            })}
          </div>
        </section>
        <section style={{border: '1px solid rgba(240,179,46,0.30)', borderRadius: 8, background: 'linear-gradient(120deg, rgba(240,179,46,0.14), rgba(242,80,107,0.08) 70%, rgba(var(--rgb-surf-2),0.5))'}}>
          <div style={{padding: 16.8}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8.4}}>
              <i className="ph-fill ph-shield-check" style={{fontSize: 17, color: 'var(--warn)'}} aria-hidden />
              <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0}}>Cobrança e cancelamento</h2>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8.4, marginTop: 14}}>
              {facts.map((fact) => (
                <div key={fact.label} style={{display: 'flex', gap: 11.2, fontSize: 12}}>
                  <span style={{flex: 1, color: 'var(--color-neutral-400)'}}>{fact.label}</span>
                  <span style={{color: 'var(--color-neutral-100)', fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{fact.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
