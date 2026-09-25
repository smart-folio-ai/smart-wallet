import {badgeStyle} from '@/components/shared/badge-style';
import type {PricingPeriod} from '@/hooks/usePlanCatalog';

interface PeriodToggleProps {
  period: PricingPeriod;
  onChange: (period: PricingPeriod) => void;
  discountBadge?: string | null;
}

export function PeriodToggle({period, onChange, discountBadge}: PeriodToggleProps) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 11.2}}>
      {discountBadge && <span style={badgeStyle('ok')}>{discountBadge}</span>}
      <div role="group" aria-label="Período de cobrança" style={{display: 'flex', gap: 2.8, padding: 2.8, border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.6)'}}>
        {(['monthly', 'annual'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={period === option}
            onClick={() => onChange(option)}
            style={{height: 24, padding: '0 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 500, fontFamily: 'var(--font-body)', ...(period === option ? {background: 'rgba(152,160,171,0.20)', color: 'var(--color-accent-200)', boxShadow: 'inset 0 0 0 1px rgba(152,160,171,0.45)'} : {background: 'transparent', color: 'var(--color-neutral-500)'})}}>
            {option === 'monthly' ? 'Mensal' : 'Anual'}
          </button>
        ))}
      </div>
    </div>
  );
}
