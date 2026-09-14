import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';
import {formatRelativeTime, type FeedInsight} from './insight-feed';
import {
  ACCENT_BUTTON_CLASS,
  ACCENT_SMALL_BUTTON_STYLE,
  CARD_STYLE,
  GHOST_BUTTON_CLASS,
  META_STYLE,
  SMALL_BUTTON_STYLE,
  badgeStyle,
} from './insights.styles';

interface InsightFeedCardProps {
  insight: FeedInsight;
  showDepth: boolean;
  now: number;
}

export function InsightFeedCard({insight, showDepth, now}: InsightFeedCardProps) {
  const navigate = useNavigate();
  const when = formatRelativeTime(insight.generatedAt, now);

  const openAuditTrail = () => {
    const origin = insight.aiGenerated ? 'gerado por LLM' : 'cálculo determinístico';
    toast.info('Trilha de auditoria', {
      description: `${insight.sources ?? 'fontes não informadas'} · modelo ${insight.model} · ${origin} · gerado ${when}.`,
    });
  };

  return (
    <section style={CARD_STYLE}>
      <div style={{padding: '14px 16.8px', display: 'flex', gap: 11.2, alignItems: 'flex-start'}}>
        <span style={badgeStyle(insight.severity)}>{insight.priority ?? '—'}</span>
        <div style={{flex: 1, minWidth: 0}}>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 14.5,
              fontWeight: 600,
              color: 'var(--color-neutral-100)',
              lineHeight: 1.35,
            }}>
            {insight.title}
          </div>
          <div style={{fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 5.6, lineHeight: 1.55}}>
            {insight.body}
          </div>
          {showDepth && insight.depth && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-neutral-500)',
                marginTop: 8.4,
                paddingLeft: 11.2,
                borderLeft: '2px solid var(--color-accent-700)',
                lineHeight: 1.55,
              }}>
              {insight.depth}
            </div>
          )}
        </div>
        <span style={{fontSize: 10.5, color: 'var(--color-neutral-600)', whiteSpace: 'nowrap'}}>
          {insight.category}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '11.2px 16.8px',
          borderTop: '1px solid var(--hair-soft)',
          flexWrap: 'wrap',
        }}>
        <span style={META_STYLE}>
          <i className="ph ph-seal-check" style={{fontSize: 12}} />
          confiança {insight.confidence ?? '—'}
        </span>
        <span style={META_STYLE}>
          <i className="ph ph-link-simple" style={{fontSize: 12}} />
          {insight.sources ?? 'fontes —'}
        </span>
        <span style={META_STYLE}>
          <i className="ph ph-clock" style={{fontSize: 12}} />
          {when}
        </span>
        <div style={{marginLeft: 'auto', display: 'flex', gap: 8.4}}>
          <button
            type="button"
            onClick={openAuditTrail}
            className={GHOST_BUTTON_CLASS}
            style={SMALL_BUTTON_STYLE}>
            Trilha de auditoria
          </button>
          <button
            type="button"
            onClick={() => navigate(insight.action.to)}
            className={ACCENT_BUTTON_CLASS}
            style={ACCENT_SMALL_BUTTON_STYLE}>
            {insight.action.label}
          </button>
        </div>
      </div>
    </section>
  );
}
