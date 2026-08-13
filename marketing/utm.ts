export type Channel = 'instagram' | 'linkedin' | 'x';

const LANDING_URL = 'https://trakkerwallet.com.br/';

// Mirrors the server's PurchaseIntentDto contract. A value the server would
// drop must fail here instead, while the link can still be fixed — once it is
// printed on a caption and published, the attribution is lost silently.
const UTM_PATTERN = /^[\w.-]+$/;
const MAX_LENGTH = 64;

export function assertValidUtmValue(value: string, label: string): void {
  if (value.length > MAX_LENGTH || !UTM_PATTERN.test(value)) {
    throw new Error(
      `Valor de UTM inválido para "${label}": ${JSON.stringify(value)}. ` +
        'Use apenas letras sem acento, números, ponto, hífen ou underscore (máx. 64).',
    );
  }
}

export function buildLandingUrl(channel: Channel, campaign: string): string {
  assertValidUtmValue(channel, 'source');
  assertValidUtmValue(campaign, 'campaign');

  return `${LANDING_URL}?utm_source=${channel}&utm_medium=social&utm_campaign=${campaign}`;
}
