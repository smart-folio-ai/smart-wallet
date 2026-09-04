import React from 'react';
import {useNavigate} from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Bucket qualitativo devolvido pelo backend em português (TRA-56).
 * Mapeia para os tokens semânticos do design system:
 *  - baixa  → neutral (var(--color-neutral-*))
 *  - média  → warn    (var(--warn))
 *  - alta   → pos     (var(--pos))
 */
export type InsightConfidenceBucket = 'baixa' | 'média' | 'alta';

export interface InsightConfidence {
  value?: number;
  bucket: InsightConfidenceBucket;
  reason?: string;
}

export interface InsightEvidence {
  label: string;
  value: string | number;
  source?: string;
}

export interface InsightSource {
  label?: string;
  url?: string;
  [key: string]: unknown;
}

export interface InsightAction {
  label: string;
  route: string;
  payload?: Record<string, unknown>;
  why?: string;
}

export type LegacyPriority = 'Alta' | 'Média' | 'Baixa';

export interface InsightCardData {
  // Header legado
  priority?: LegacyPriority;
  category?: string;
  symbol?: string;
  // Conteúdo
  title: string;
  /** Descrição legada (usada quando não há `rationale`). */
  body?: string;
  /** Nota adicional legada (auditoria curta). */
  note?: string;
  when?: string;
  /**
   * Confidence: aceita número (shape legada da UI original) ou objeto novo
   * TRA-56/133. O objeto é o formato correto — o número é apenas
   * compatibilidade de leitura.
   */
  confidence?: number | InsightConfidence;
  /**
   * Fontes: string curta legada OU lista de chips. Um chip com `url` vira
   * link, sem URL fica apenas como badge.
   */
  sources?: string | InsightSource[];
  // Campos novos TRA-56
  evidence?: InsightEvidence[];
  rationale?: string;
  action?: InsightAction;
}

// ─── Style tokens ────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<LegacyPriority, string> = {
  Alta: 'var(--neg)',
  Média: 'var(--warn)',
  Baixa: 'var(--pos)',
};

const PRIORITY_DISPLAY: Record<LegacyPriority, string> = {
  Alta: 'ALTO',
  Média: 'MÉDIO',
  Baixa: 'BAIXO',
};

const BUCKET_TONE: Record<
  InsightConfidenceBucket,
  {label: string; color: string; bg: string}
> = {
  baixa: {
    label: 'Confiança baixa',
    color: 'var(--color-neutral-400)',
    bg: 'var(--surf-3)',
  },
  média: {
    label: 'Confiança média',
    color: 'var(--warn)',
    bg: 'var(--badge-warn-bg)',
  },
  alta: {
    label: 'Confiança alta',
    color: 'var(--pos)',
    bg: 'var(--badge-pos-bg)',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Retorna true quando um payload pode ser serializado com segurança como
 * querystring (chaves string, valores primitivos). Objetos aninhados / arrays
 * caem no fallback via `navigate(..., {state})`.
 */
function isFlatSerializable(
  payload: Record<string, unknown> | undefined,
): payload is Record<string, string | number | boolean> {
  if (!payload) return false;
  return Object.values(payload).every(
    (v) =>
      v === null ||
      ['string', 'number', 'boolean'].includes(typeof v),
  );
}

function buildTarget(action: InsightAction): {
  to: string;
  state: unknown;
} {
  if (isFlatSerializable(action.payload)) {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(action.payload!)) {
      if (v === null) continue;
      search.set(k, String(v));
    }
    const qs = search.toString();
    // Preserva query pré-existente na rota
    const sep = action.route.includes('?') ? '&' : '?';
    return {
      to: qs ? `${action.route}${sep}${qs}` : action.route,
      state: action.payload,
    };
  }
  return {to: action.route, state: action.payload};
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface InsightCardProps {
  insight: InsightCardData;
}

export const InsightCard: React.FC<InsightCardProps> = ({insight}) => {
  const navigate = useNavigate();

  const confidenceObj: InsightConfidence | undefined =
    insight.confidence && typeof insight.confidence === 'object'
      ? insight.confidence
      : undefined;
  const legacyConfidenceNumber =
    typeof insight.confidence === 'number' ? insight.confidence : undefined;

  const legacySourcesString =
    typeof insight.sources === 'string' ? insight.sources : undefined;
  const sourceChips = Array.isArray(insight.sources)
    ? insight.sources
    : undefined;

  const body = insight.rationale ?? insight.body;

  const handleAction = () => {
    if (!insight.action) return;
    const {to, state} = buildTarget(insight.action);
    navigate(to, {state});
  };

  return (
    <div
      style={{
        border: '1px solid var(--hair)',
        borderRadius: 8,
        background: 'var(--nk-card)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
      {/* Header row: priority + symbol + category + confidence pill */}
      {(insight.priority ||
        insight.symbol ||
        insight.category ||
        confidenceObj) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}>
          {insight.priority && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 10,
                background: PRIORITY_COLOR[insight.priority] + '22',
                color: PRIORITY_COLOR[insight.priority],
              }}>
              {PRIORITY_DISPLAY[insight.priority]}
            </span>
          )}
          {insight.symbol && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'var(--surf-3)',
                color: 'var(--color-neutral-400)',
              }}>
              {insight.symbol}
            </span>
          )}
          {confidenceObj && <ConfidencePill confidence={confidenceObj} />}
          {insight.category && (
            <span
              style={{
                fontSize: 10.5,
                color: 'var(--color-neutral-600)',
                marginLeft: 'auto',
              }}>
              {insight.category}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 14.5,
          fontWeight: 600,
          lineHeight: 1.35,
        }}>
        {insight.title}
      </div>

      {/* Body / rationale */}
      {body && (
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--color-neutral-400)',
            lineHeight: 1.6,
          }}>
          {body}
        </div>
      )}

      {/* Evidence list */}
      {insight.evidence && insight.evidence.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
          {insight.evidence.map((ev, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
                fontSize: 11.5,
                color: 'var(--color-neutral-400)',
              }}>
              <span style={{color: 'var(--color-neutral-500)'}}>
                {ev.label}
              </span>
              <span aria-hidden="true" style={{color: 'var(--color-neutral-700)'}}>
                ·
              </span>
              <span style={{fontFamily: 'monospace', color: 'var(--color-neutral-300)'}}>
                {ev.value}
              </span>
              {ev.source && (
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'var(--color-neutral-600)',
                    marginLeft: 4,
                  }}>
                  ({ev.source})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Legacy note */}
      {insight.note && (
        <div
          style={{
            borderLeft: '2px solid var(--color-accent-700)',
            paddingLeft: 10,
            fontSize: 11.5,
            color: 'var(--color-neutral-500)',
            lineHeight: 1.5,
          }}>
          {insight.note}
        </div>
      )}

      {/* Source chips (new) */}
      {sourceChips && sourceChips.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginTop: 2,
          }}>
          {sourceChips.map((src, i) => {
            const label = src.label || src.url || `Fonte ${i + 1}`;
            const baseStyle: React.CSSProperties = {
              fontSize: 10.5,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'var(--surf-3)',
              color: 'var(--color-neutral-400)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            };
            if (src.url) {
              return (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{...baseStyle, color: 'var(--color-accent-300)'}}>
                  {label}
                  <i
                    className="ph ph-arrow-square-out"
                    style={{fontSize: 10}}
                    aria-hidden="true"
                  />
                </a>
              );
            }
            return (
              <span key={i} style={baseStyle}>
                {label}
              </span>
            );
          })}
        </div>
      )}

      {/* Legacy footer (confidence number / sources string / when) */}
      {(legacyConfidenceNumber !== undefined ||
        legacySourcesString ||
        insight.when) && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            fontSize: 10.5,
            color: 'var(--color-neutral-600)',
            borderTop: '1px solid var(--hair-soft)',
            paddingTop: 8,
          }}>
          {legacyConfidenceNumber !== undefined && (
            <span>Confiança: {legacyConfidenceNumber}%</span>
          )}
          {legacySourcesString && <span>Fontes: {legacySourcesString}</span>}
          {insight.when && <span>{insight.when}</span>}
        </div>
      )}

      {/* Action */}
      {insight.action && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4}}>
          <button
            type="button"
            onClick={handleAction}
            style={{
              width: '100%',
              height: 36,
              borderRadius: 6,
              border: '1px solid var(--ac)',
              background: 'var(--ac)',
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}>
            {insight.action.label}
          </button>
          {insight.action.why && (
            <span
              style={{
                fontSize: 10.5,
                color: 'var(--color-neutral-600)',
                lineHeight: 1.4,
              }}>
              {insight.action.why}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Confidence pill ─────────────────────────────────────────────────────────

const ConfidencePill: React.FC<{confidence: InsightConfidence}> = ({
  confidence,
}) => {
  const tone = BUCKET_TONE[confidence.bucket];
  const percent =
    typeof confidence.value === 'number'
      ? ` ${Math.round(confidence.value * (confidence.value <= 1 ? 100 : 1))}%`
      : '';
  const pill = (
    <span
      aria-label={tone.label}
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 10,
        background: tone.bg,
        color: tone.color,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
      {tone.label}
      {percent}
    </span>
  );
  if (!confidence.reason) return pill;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          style={{
            all: 'unset',
            cursor: 'help',
          }}>
          {pill}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" style={{maxWidth: 280}}>
        {confidence.reason}
      </TooltipContent>
    </Tooltip>
  );
};

export default InsightCard;
