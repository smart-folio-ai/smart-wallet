import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import SubscriptionService from '@/services/subscription';
import PixPaymentService from '@/services/pix';
import type {CurrentSubscriptionResponse} from '@/interface/subscription';
import {formatCurrency} from '@/utils/formatters';
import {PlanCard} from '@/components/subscription/PlanCard';
import {planCtaStyle} from '@/components/subscription/plan-cta-style';
import {PeriodToggle} from '@/components/subscription/PeriodToggle';
import {PixCheckoutModal} from '@/components/subscription/PixCheckoutModal';
import {usePlanCatalog, usePlanCheckout, type PricingPeriod} from '@/hooks/usePlanCatalog';

const mutedCta = {...planCtaStyle(false), cursor: 'default', color: 'var(--color-neutral-500)'} as const;

/** Planos — cards do handoff da landing (Trackerr Landing.dc.html · Planos) dentro do app. */
export default function Plans() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PricingPeriod>('monthly');
  const [pixPlan, setPixPlan] = useState<{id: string; name: string} | null>(null);
  const {isLoading, columns, discountBadge, featuresByPlan} = usePlanCatalog();
  const {subscribe, isPending, isOpening} = usePlanCheckout(period);
  const current = useQuery<CurrentSubscriptionResponse>({queryKey: ['current-subscription'], queryFn: () => SubscriptionService.getCurrentPlan()});
  // PIX (TRA-195): a opção só aparece quando o server consegue de fato cobrar.
  const pixAvailable = useQuery({queryKey: ['pix-availability'], queryFn: () => PixPaymentService.isAvailable()});

  const currentPlanId = current.data?.plan?._id ?? null;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 22.4, maxWidth: 1120, width: '100%', margin: '0 auto'}}>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16.8, flexWrap: 'wrap'}}>
        <div>
          <div style={{fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-accent-300)'}}>Planos</div>
          <h1 style={{fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', margin: '8.4px 0 0'}}>Escolha a profundidade, não o desconto</h1>
          <div style={{fontSize: 12.5, color: 'var(--color-neutral-500)', marginTop: 5.6}}>
            Cobrança {period === 'annual' ? 'anual' : 'mensal'} pelo Stripe · cancele quando quiser · reembolso em até 7 dias
          </div>
        </div>
        <PeriodToggle period={period} onChange={setPeriod} discountBadge={discountBadge} />
      </div>

      {isLoading ? (
        <div style={{fontSize: 12.5, color: 'var(--color-neutral-500)'}}>Carregando planos…</div>
      ) : columns.length === 0 ? (
        <div style={{fontSize: 12.5, color: 'var(--color-neutral-500)'}}>Nenhum plano disponível no momento.</div>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-[16.8px] md:grid-cols-3">
          {columns.map((column) => {
            const free = column.monthlyPrice <= 0;
            const isCurrent = column.plan._id === currentPlanId || (!currentPlanId && free);
            const showAnnual = period === 'annual' && column.hasRealAnnualPrice && !free;
            return (
              <div key={column.plan._id} style={{display: 'flex'}}>
                <PlanCard
                  name={column.plan.name}
                  price={free ? 'Grátis' : formatCurrency(showAnnual ? column.annualPrice : column.monthlyPrice)}
                  period={free ? '' : showAnnual ? '/ano' : '/mês'}
                  priceNote={showAnnual ? `equivale a ${formatCurrency(column.annualPrice / 12)}/mês` : undefined}
                  detail={column.plan.description}
                  features={featuresByPlan.get(column.plan._id) ?? []}
                  featured={Boolean(column.plan.isFeatured)}
                  badge={isCurrent ? 'Plano atual' : column.plan.isComingSoon ? 'Em breve' : column.plan.isFeatured ? 'Mais assinado' : undefined}>
                  {isCurrent ? (
                    <span style={mutedCta}>Seu plano</span>
                  ) : free ? (
                    <span style={mutedCta}>Disponível pelo portal</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => subscribe(column.plan)}
                        disabled={isPending || column.plan.isComingSoon}
                        className="disabled:cursor-not-allowed disabled:opacity-60"
                        style={planCtaStyle(Boolean(column.plan.isFeatured))}>
                        {column.plan.isComingSoon ? 'Em breve' : isOpening(column.plan) ? 'Abrindo…' : `Assinar ${column.plan.name}`}
                      </button>
                      {!column.plan.isComingSoon && pixAvailable.data && (
                        <button
                          type="button"
                          onClick={() => setPixPlan({id: column.plan._id, name: column.plan.name})}
                          className="hover:text-[color:var(--color-neutral-100)]"
                          style={{margin: '8.4px auto 0', padding: 0, border: 'none', background: 'transparent', color: 'var(--color-neutral-400)', fontFamily: 'var(--font-body)', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3}}>
                          ou pagar com PIX
                        </button>
                      )}
                    </>
                  )}
                </PlanCard>
              </div>
            );
          })}
        </div>
      )}

      <div style={{display: 'flex', justifyContent: 'center'}}>
        <Link
          to="/subscription"
          className="hover:text-[color:var(--color-neutral-100)]"
          style={{fontSize: 12, color: 'var(--color-neutral-400)', textDecoration: 'underline', textUnderlineOffset: 3}}>
          Ver minha assinatura e comparar todos os recursos
        </Link>
      </div>

      <PixCheckoutModal
        open={pixPlan !== null}
        onOpenChange={(open) => !open && setPixPlan(null)}
        plan={pixPlan}
        interval={period === 'annual' ? 'year' : 'month'}
        onManageSubscription={() => {
          setPixPlan(null);
          navigate('/subscription');
        }}
      />
    </div>
  );
}
