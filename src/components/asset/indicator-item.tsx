import {Info} from '@/components/ui/icons';
import {Badge} from '@/components/ui/badge';

export const INDICATOR_UNAVAILABLE_TEXT = '—';
export const INDICATOR_NOT_APPLICABLE_TEXT = 'Não se aplica';

export type IndicatorStatus = 'ok' | 'unavailable' | 'not_applicable';

/**
 * `derived` nao e uma fonte de dado, e um calculo nosso — e "derived" e
 * jargao em ingles numa UI em portugues. Os outros tres sao nomes proprios
 * das fontes e ficam como estao.
 */
const SOURCE_LABELS: Record<string, string> = {
  derived: 'estimado',
};

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export interface IndicatorItemProps {
  label: string;
  status: IndicatorStatus;
  value: number | null;
  source?: string | null;
  isRestricted?: boolean;
  formatter?: (value: number) => string;
}

export function IndicatorItem({
  label,
  status,
  value,
  source,
  isRestricted,
  formatter = (v) => String(v),
}: IndicatorItemProps) {
  if (isRestricted) {
    return (
      <div className="flex justify-between items-center opacity-60">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="outline" className="text-[10px] py-0 px-1 border-dashed">
          EM BREVE
        </Badge>
      </div>
    );
  }

  const hasValue = status === 'ok' && typeof value === 'number';
  const display = hasValue
    ? formatter(value as number)
    : status === 'not_applicable'
      ? INDICATOR_NOT_APPLICABLE_TEXT
      : INDICATOR_UNAVAILABLE_TEXT;

  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
        {label}
        <Info className="h-3 w-3 cursor-help" />
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className={
            hasValue ? 'font-bold text-sm' : 'text-sm text-muted-foreground'
          }>
          {display}
        </span>
        {hasValue && source && (
          <span className="text-[10px] uppercase text-muted-foreground/60">
            {sourceLabel(source)}
          </span>
        )}
      </div>
    </div>
  );
}
