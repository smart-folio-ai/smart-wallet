import {useNavigate} from 'react-router-dom';
import {SectionHeader} from '@/components/shared';
import {AiGeneratedNotice} from '@/components/ui/ai-generated-notice';
import type {AllocationItem} from '@/services/ai';
import {ACCENT_BUTTON_CLASS, CARD_STYLE} from './insights.styles';

/** Opinião textual do LLM — não existe no handoff; segue na coluna lateral. */
export function PortfolioOpinionCard({assessment}: {assessment: string}) {
  return (
    <section style={CARD_STYLE}>
      <SectionHeader title="Opinião Trackerr" subtitle="Leitura geral da carteira" />
      <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 8.4}}>
        <p style={{margin: 0, fontSize: 12.5, color: 'var(--color-neutral-400)', lineHeight: 1.55}}>
          {assessment}
        </p>
        <AiGeneratedNotice />
      </div>
    </section>
  );
}

export function AllocationProposalCard({items}: {items: AllocationItem[]}) {
  return (
    <section style={CARD_STYLE}>
      <SectionHeader title="Proposta de alocação" subtitle="Atual × sugerida pelo modelo de rebalanceamento" />
      <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 11.2}}>
        {items.map((item) => (
          <div key={item.category} style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 12}}>
              <span style={{color: 'var(--color-neutral-300)'}}>{item.category}</span>
              <span style={{fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-500)'}}>
                {item.current.toFixed(1)}% → <span style={{color: 'var(--color-accent-200)'}}>{item.ideal.toFixed(1)}%</span>
              </span>
            </div>
            <div style={{height: 6, borderRadius: 2, background: 'rgba(var(--rgb-line),0.06)', overflow: 'hidden', display: 'flex'}}>
              <div style={{width: `${Math.min(item.current, 100)}%`, background: 'var(--color-neutral-600)'}} />
              <div style={{width: `${Math.max(0, item.ideal - item.current)}%`, background: 'var(--color-accent-400)'}} />
            </div>
          </div>
        ))}
        <AiGeneratedNotice />
      </div>
    </section>
  );
}

export function UpgradeCard() {
  const navigate = useNavigate();
  return (
    <section
      style={{
        border: '1px solid rgba(152,160,171,0.28)',
        borderRadius: 8,
        background: 'linear-gradient(100deg, rgba(var(--rgb-accent-deep),0.40), rgba(var(--rgb-surf),0.28))',
        padding: '14px 16.8px',
        display: 'flex',
        gap: 11.2,
        alignItems: 'flex-start',
      }}>
      <i className="ph-fill ph-sparkle" style={{fontSize: 16, color: 'var(--color-accent-300)', marginTop: 2}} />
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600}}>
          Insights da IA fazem parte do plano Pro
        </div>
        <div style={{fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 5.6, lineHeight: 1.55}}>
          Com o Pro, o radar de riscos, o score da carteira e a análise da IA passam a aparecer aqui.
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate('/plans')}
        className={ACCENT_BUTTON_CLASS}
        style={{
          height: 28,
          padding: '0 11.2px',
          borderRadius: 6,
          border: '1px solid var(--color-accent-700)',
          color: 'var(--color-accent-200)',
          fontFamily: 'var(--font-body)',
          fontSize: 11.5,
          fontWeight: 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
        Ver planos
      </button>
    </section>
  );
}
