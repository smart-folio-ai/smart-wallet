export interface AiInsightBannerProps {
  text: string;
  meta?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AiInsightBanner({text, meta, actionLabel, onAction}: AiInsightBannerProps) {
  return (
    <div style={{display: 'flex', alignItems: 'flex-start', gap: 11.2, border: '1px solid rgba(145,132,217,0.28)', borderRadius: 8, padding: '11.2px 16.8px', background: 'linear-gradient(100deg, rgba(var(--rgb-accent-deep),0.42), rgba(var(--rgb-surf),0.30))'}}>
      <i className="ph-fill ph-sparkle" style={{fontSize: 16, color: 'var(--color-accent-300)', marginTop: 1, flexShrink: 0}} />
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{fontSize: 12.5, color: 'var(--color-neutral-200)', lineHeight: 1.5}}>{text}</div>
        {meta && <div style={{fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 2.8}}>{meta}</div>}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{height: 26, padding: '0 8.4px', border: '1px solid var(--hair)', borderRadius: 6, background: 'transparent', color: 'var(--color-neutral-400)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)'}}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
