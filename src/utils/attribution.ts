export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

const STORAGE_KEY = 'trackerr:attribution';

// Mirrors the server's DTO validation. A value that would be rejected there
// is dropped here instead of sent, so a malformed link cannot turn a
// capture into a 400.
const VALUE_PATTERN = /^[\w.-]+$/;
const MAX_LENGTH = 64;

const PARAM_TO_FIELD: ReadonlyArray<[string, keyof Attribution]> = [
  ['utm_source', 'utmSource'],
  ['utm_medium', 'utmMedium'],
  ['utm_campaign', 'utmCampaign'],
];

function isUsable(value: string | null): value is string {
  return (
    value !== null && value.length <= MAX_LENGTH && VALUE_PATTERN.test(value)
  );
}

export function captureAttribution(search: string): void {
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return;
  }
  // First touch wins: a visitor who arrives from one channel and then follows
  // an internal link stays credited to the channel that brought them.
  if (stored !== null) return;

  const params = new URLSearchParams(search);
  const attribution: Attribution = {};

  for (const [param, field] of PARAM_TO_FIELD) {
    const value = params.get(param);
    if (isUsable(value)) {
      attribution[field] = value;
    }
  }

  if (Object.keys(attribution).length === 0) return;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Attribution is a nice-to-have; never let storage failure break the page.
  }
}

export function getAttribution(): Attribution {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) return {};

    const attribution: Attribution = {};
    for (const [, field] of PARAM_TO_FIELD) {
      const value = (parsed as Record<string, unknown>)[field];
      if (typeof value === 'string' && isUsable(value)) {
        attribution[field] = value;
      }
    }
    return attribution;
  } catch {
    return {};
  }
}
