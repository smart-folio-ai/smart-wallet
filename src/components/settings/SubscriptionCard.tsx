import {Link} from 'react-router-dom';
import {useSubscription} from '@/hooks/useSubscription';
import {formatDate} from '@/utils';
import {
  ACCENT_SMALL_BUTTON_CLASS,
  ACCENT_SMALL_BUTTON_STYLE,
  CARD_STYLE,
  SettingsCardHeader,
  badgeStyle,
} from './settings-ui';

// Sem `features` na API, useSubscription deriva chaves internas do nome do plano.
const FEATURE_LABELS: Record<string, string> = {
  comparator: 'Comparador de ativos',
  ai_insights: 'IA Insights',
};

/** O handoff não tem este bloco; segue o mesmo desenho das linhas de Segurança. */
export function SubscriptionCard() {
  const {isLoading, isSubscribed, displayPlanName, currentPeriodEnd, features} =
    useSubscription();

  return (
    <section style={CARD_STYLE}>
      <SettingsCardHeader
        title="Assinatura"
        action={
          <Link to="/subscription" className={ACCENT_SMALL_BUTTON_CLASS} style={ACCENT_SMALL_BUTTON_STYLE}>
            Gerenciar plano
          </Link>
        }
      />
      <div style={{padding: '5.6px 0'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '11.2px 16.8px'}}>
          <i className="ph ph-crown" aria-hidden="true" style={{fontSize: 16, color: 'var(--color-accent-300)'}} />
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{fontSize: 12.5, color: 'var(--color-neutral-200)'}}>
              {isLoading ? 'Carregando plano…' : displayPlanName}
            </div>
            <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2, lineHeight: 1.4}}>
              {currentPeriodEnd
                ? `Período atual até ${formatDate(currentPeriodEnd)}`
                : isSubscribed
                  ? 'Assinatura ativa'
                  : 'Sem assinatura paga'}
            </div>
          </div>
          {isLoading ? null : (
            <span style={badgeStyle(isSubscribed ? 'ok' : 'info')}>
              {isSubscribed ? 'Ativa' : 'Inativa'}
            </span>
          )}
        </div>
        {features.length > 0 ? (
          <ul style={{listStyle: 'none', margin: 0, padding: '0 16.8px 11.2px 44px', display: 'flex', flexDirection: 'column', gap: 4}}>
            {features.map((feature) => (
              <li key={feature} style={{display: 'flex', alignItems: 'center', gap: 5.6, fontSize: 11.5, color: 'var(--color-neutral-400)'}}>
                <i className="ph ph-check" aria-hidden="true" style={{fontSize: 12, color: 'var(--pos)'}} />
                {FEATURE_LABELS[feature] ?? feature}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
