import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import SubscriptionService from '@/services/subscription';
import {normalizePlanPricing} from '@/utils/planPricing';
import {formatCurrency} from '@/utils/formatters';
import {PurchaseIntentModal} from '../PurchaseIntentModal';
import {PlanCard} from '@/components/subscription/PlanCard';
import {planCtaStyle} from '@/components/subscription/plan-cta-style';
import {cumulativeFeatures} from '@/utils/planFeatures';
import {TrackerrMark} from './TrackerrMark';
import {CONTACT_EMAIL, CTA_BULLETS, FAQ, FOOTER_COLUMNS} from './landing-content';

const EYEBROW: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-accent-300)',
};

const H2_BASE: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  color: 'var(--color-text)',
};

type LandingPlan = {
  id: string;
  name: string;
  price: string;
  period: string;
  detail: string;
  features: string[];
  isFree: boolean;
  featured: boolean;
  comingSoon: boolean;
  cta: string;
};

/**
 * Planos com o visual do handoff e os dados reais do Stripe (fonte de
 * verdade comercial): o preço exibido é sempre o cobrado.
 */
export function PlansSection() {
  const [modalPlan, setModalPlan] = useState<{id: string; name: string} | null>(null);
  const {data, isLoading, isError, refetch} = useQuery({
    queryKey: ['landing-plans'],
    queryFn: () => SubscriptionService.getPlans(),
    retry: false,
  });

  const active = [...(data ?? [])].filter((plan) => plan.isActive).sort((a, b) => a.price - b.price);
  const featuredIndex = active.findIndex((plan) => plan.isFeatured === true);
  const featuresByPlan = cumulativeFeatures(active);
  const plans: LandingPlan[] = active.map((plan, index) => {
    const {monthlyPrice} = normalizePlanPricing(plan);
    const isFree = monthlyPrice === 0;
    const comingSoon = plan.isComingSoon === true;
    return {
      id: plan._id,
      name: plan.name,
      price: isFree ? 'Grátis' : formatCurrency(monthlyPrice, plan.currency),
      period: isFree ? '' : '/mês',
      detail: plan.description,
      features: featuresByPlan.get(plan._id) ?? [],
      isFree,
      featured: index === featuredIndex,
      comingSoon,
      cta: comingSoon ? 'Em breve' : isFree ? 'Começar grátis' : `Assinar ${plan.name}`,
    };
  });


  return (
    <section id="planos" style={{maxWidth: 1200, margin: '0 auto', padding: '80px 32px'}}>
      <div
        style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap'}}>
        <div style={{maxWidth: 560}}>
          <div style={EYEBROW}>Planos · Pricing</div>
          <h2 style={{...H2_BASE, fontSize: 36, letterSpacing: '-0.025em', margin: '11.2px 0 0'}}>
            Escolha a profundidade, não o desconto
          </h2>
          <p style={{fontSize: 14.5, lineHeight: 1.6, color: 'var(--color-neutral-400)', margin: '11.2px 0 0'}}>
            Todos os planos incluem consolidação multi-corretora e o copiloto. O que muda é o alcance analítico, o volume
            de contas e o nível de suporte.
          </p>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 8.4, fontSize: 12, color: 'var(--color-neutral-500)'}}>
          <i className="ph ph-shield-check" style={{fontSize: 15, color: 'var(--pos)'}} />
          <span>Cancelamento pelo painel</span>
        </div>
      </div>

      {isLoading ? (
        <div data-testid="plans-loading" style={{marginTop: 40, fontSize: 13, color: 'var(--color-neutral-500)'}}>
          Carregando planos…
        </div>
      ) : isError ? (
        <div style={{marginTop: 40, fontSize: 13, color: 'var(--color-neutral-500)'}}>
          Não foi possível carregar os planos.{' '}
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--color-accent-300)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
            }}>
            Tentar novamente
          </button>
        </div>
      ) : plans.length === 0 ? (
        <div
          data-testid="plans-empty"
          style={{
            marginTop: 40,
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'var(--nk-card)',
            padding: 22.4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16.8,
            flexWrap: 'wrap',
          }}>
          <div style={{fontSize: 13.5, color: 'var(--color-neutral-400)'}}>
            Nenhum plano disponível no momento. Você já pode criar sua conta e começar grátis.
          </div>
          <Link to="/register" className="tl-plan-cta" style={{...planCtaStyle(true), marginTop: 0, padding: '0 16.8px'}}>
            Criar conta
          </Link>
        </div>
      ) : (
        <div
          className="tl-grid-4"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(1, Math.min(plans.length, 4))}, minmax(0, 1fr))`,
            gap: 16.8,
            marginTop: 40,
            alignItems: 'start',
          }}>
          {plans.map((p) => (
            <div key={p.id} data-testid="landing-plan" style={{display: 'flex'}}>
              <PlanCard
                name={p.name}
                price={p.price}
                period={p.period}
                detail={p.detail}
                features={p.features}
                featured={p.featured}
                badge={p.featured ? 'Mais assinado' : undefined}>
                {p.comingSoon ? (
                  <button type="button" disabled style={{...planCtaStyle(false), cursor: 'not-allowed', opacity: 0.6}}>
                    {p.cta}
                  </button>
                ) : p.isFree ? (
                  <Link to="/register" className="tl-plan-cta" style={planCtaStyle(p.featured)}>
                    {p.cta}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="tl-plan-cta"
                    onClick={() => setModalPlan({id: p.id, name: p.name})}
                    style={planCtaStyle(p.featured)}>
                    {p.cta}
                  </button>
                )}
              </PlanCard>
            </div>
          ))}
        </div>
      )}

      {modalPlan && (
        <PurchaseIntentModal
          open
          onOpenChange={(open) => !open && setModalPlan(null)}
          planId={modalPlan.id}
          planName={modalPlan.name}
        />
      )}
    </section>
  );
}

export function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" style={{borderTop: '1px solid var(--hair-soft)'}}>
      <div
        className="tl-grid-2"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '72px 32px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)',
          gap: 48,
        }}>
        <div>
          <div style={EYEBROW}>FAQ</div>
          <h2 style={{...H2_BASE, fontSize: 30, letterSpacing: '-0.025em', margin: '11.2px 0 0', lineHeight: 1.2}}>
            O que costumam perguntar antes de assinar
          </h2>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            style={{display: 'inline-flex', alignItems: 'center', gap: 5.6, fontSize: 13, marginTop: 22.4}}>
            Falar com um especialista <i className="ph ph-arrow-right" style={{fontSize: 13}} />
          </a>
        </div>
        <div style={{display: 'flex', flexDirection: 'column'}}>
          {FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.question} style={{borderTop: '1px solid var(--hair-soft)', padding: '16.8px 0'}}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11.2,
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--color-neutral-100)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 14.5,
                    fontWeight: 500,
                  }}>
                  <span style={{flex: 1}}>{f.question}</span>
                  <i
                    className={isOpen ? 'ph ph-minus' : 'ph ph-plus'}
                    style={{fontSize: 15, color: 'var(--color-neutral-500)'}}
                  />
                </button>
                {isOpen && (
                  <div
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.65,
                      color: 'var(--color-neutral-400)',
                      marginTop: 11.2,
                      maxWidth: 620,
                    }}>
                    {f.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section
      style={{
        borderTop: '1px solid var(--hair-soft)',
        background:
          'radial-gradient(900px 420px at 50% 120%, var(--neb-1) 0%, rgba(var(--rgb-accent-deep),0) 60%), var(--color-bg)',
      }}>
      <div style={{maxWidth: 1200, margin: '0 auto', padding: '88px 32px', textAlign: 'center'}}>
        <h2 style={{...H2_BASE, fontSize: 40, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1}}>
          Pare de consolidar carteira na mão
        </h2>
        <p
          style={{
            fontSize: 15.5,
            color: 'var(--color-neutral-400)',
            margin: '16.8px auto 0',
            maxWidth: 520,
            lineHeight: 1.6,
          }}>
          Conecte sua carteira e receba a primeira leitura de risco, concentração e impacto fiscal em minutos.
        </p>
        <div style={{display: 'flex', gap: 11.2, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap'}}>
          <Link
            to="/register"
            className="tl-cta-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8.4,
              height: 46,
              padding: '0 28px',
              border: '1px solid var(--color-accent)',
              borderRadius: 8,
              fontSize: 14.5,
              fontWeight: 500,
              boxShadow: '0 0 40px rgba(152,160,171,0.20)',
            }}>
            Criar minha conta
            <i className="ph ph-arrow-right" style={{fontSize: 15}} />
          </Link>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Demonstração do Trackerr')}`}
            className="tl-cta-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 46,
              padding: '0 28px',
              border: '1px solid var(--hair)',
              borderRadius: 8,
              fontSize: 14.5,
              fontWeight: 500,
            }}>
            Agendar demonstração
          </a>
        </div>
        <div style={{display: 'flex', gap: 22.4, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap'}}>
          {CTA_BULLETS.map((label) => (
            <div
              key={label}
              style={{display: 'flex', alignItems: 'center', gap: 5.6, fontSize: 12, color: 'var(--color-neutral-500)'}}>
              <i className="ph ph-check-circle" style={{fontSize: 14, color: 'var(--pos)'}} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer style={{borderTop: '1px solid var(--hair-soft)', background: 'rgba(var(--rgb-bg),0.9)'}}>
      <div
        className="tl-grid-footer"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '48px 32px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))',
          gap: 32,
        }}>
        <div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8.4}}>
            <TrackerrMark size={24} />
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: '-0.015em',
                color: 'var(--color-text)',
              }}>
              Trackerr
            </span>
          </div>
          <p style={{fontSize: 12, color: 'var(--color-neutral-600)', lineHeight: 1.6, margin: '14px 0 0', maxWidth: 300}}>
            O Trackerr não é consultoria de investimento e não recomenda ativos. Ele mostra o que está fora da estratégia
            que você definiu.
          </p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-neutral-600)',
                fontWeight: 600,
              }}>
              {col.title}
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8.4, marginTop: 14}}>
              {col.links.map((link) =>
                link.to.startsWith('#') ? (
                  <a key={link.label} href={link.to} className="tl-footer-link" style={{fontSize: 12.5}}>
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.label} to={link.to} className="tl-footer-link" style={{fontSize: 12.5}}>
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{borderTop: '1px solid var(--hair-soft)'}}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '16.8px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16.8,
            fontSize: 11.5,
            color: 'var(--color-neutral-600)',
            flexWrap: 'wrap',
          }}>
          <span>© {new Date().getFullYear()} Trackerr Tecnologia Ltda</span>
          <span>Ambiente seguro · LGPD · AES-256 · Argon2</span>
        </div>
      </div>
    </footer>
  );
}
