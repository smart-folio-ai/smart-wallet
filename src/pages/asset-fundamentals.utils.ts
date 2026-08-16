import type {IndicatorStatus} from '@/components/asset/indicator-item';

export interface IndicatorView {
  status: IndicatorStatus;
  value: number | null;
  source: string | null;
}

const ABSENT: IndicatorView = {status: 'unavailable', value: null, source: null};

const KNOWN_STATUSES: IndicatorStatus[] = ['ok', 'unavailable', 'not_applicable'];

export function readIndicator(
  fundamentals: unknown,
  key: string,
): IndicatorView {
  const values = (fundamentals as any)?.values;
  const entry = values?.[key];
  if (!entry) return ABSENT;

  const status = entry.status as IndicatorStatus;
  if (!KNOWN_STATUSES.includes(status)) return ABSENT;

  if (status !== 'ok') {
    return {status, value: null, source: null};
  }

  return typeof entry.value === 'number' && Number.isFinite(entry.value)
    ? {status: 'ok', value: entry.value, source: entry.source ?? null}
    : ABSENT;
}
