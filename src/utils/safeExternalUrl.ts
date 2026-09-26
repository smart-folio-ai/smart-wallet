/**
 * Link vindo de fora (fonte de insight da IA, documento de RI raspado de
 * site de terceiro) só vira href/window.open se for http(s). React 18 não
 * bloqueia `javascript:` em href.
 */
export function safeExternalUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}
