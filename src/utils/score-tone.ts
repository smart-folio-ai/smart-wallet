export type ScoreTone = 'warning' | 'neutral' | 'positive';

export function resolveScoreTone(score: number | null): ScoreTone {
  if (score === null) return 'neutral';
  if (score < 40) return 'warning';
  if (score < 80) return 'neutral';
  return 'positive';
}

export const SCORE_TONE_CLASSES: Record<
  ScoreTone,
  {text: string; border: string; stroke: string; bg: string}
> = {
  warning: {
    text: 'text-warning',
    border: 'border-warning/20',
    stroke: 'stroke-warning',
    bg: 'bg-warning/5',
  },
  neutral: {
    text: 'text-foreground',
    border: 'border-border/60',
    stroke: 'stroke-foreground',
    bg: 'bg-muted/5',
  },
  positive: {
    text: 'text-positive',
    border: 'border-positive/20',
    stroke: 'stroke-positive',
    bg: 'bg-positive/5',
  },
};
