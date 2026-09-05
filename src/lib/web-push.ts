/**
 * TRA-136 — helpers puros de Web Push.
 *
 * Ficam separados do serviço porque não tocam em rede nem em estado: são
 * funções testáveis sozinhas, e o `urlBase64ToUint8Array` em particular é o
 * ponto clássico de falha silenciosa (chave VAPID malformada faz o
 * `pushManager.subscribe` rejeitar sem mensagem útil).
 */

export type PushUnsupportedReason =
  | 'insecure-context'
  | 'no-service-worker'
  | 'no-push-manager'
  | 'no-notification-api';

export type PushAvailability =
  | {status: 'supported'}
  /** iOS/iPadOS no Safari: push só existe com o app na tela de início. */
  | {status: 'ios-install-required'}
  | {status: 'unsupported'; reason: PushUnsupportedReason};

/**
 * Converte a chave pública VAPID (base64url, sem padding) para o
 * `Uint8Array` que `applicationServerKey` exige.
 *
 * base64url troca `+` por `-` e `/` por `_` e corta o `=` final; passar a
 * string crua para `atob` gera `InvalidCharacterError` ou — pior — uma chave
 * silenciosamente errada, e o push nunca chega.
 */
export function urlBase64ToUint8Array(
  base64String: string,
): Uint8Array<ArrayBuffer> {
  const trimmed = (base64String ?? '').trim();

  if (!trimmed) {
    throw new Error('Chave VAPID vazia.');
  }

  const padding = '='.repeat((4 - (trimmed.length % 4)) % 4);
  const base64 = (trimmed + padding).replace(/-/g, '+').replace(/_/g, '/');

  let raw: string;
  try {
    raw = atob(base64);
  } catch (error) {
    throw new Error('Chave VAPID inválida: não é base64url.');
  }

  // `new Uint8Array(new ArrayBuffer(n))` em vez de `new Uint8Array(n)`: o
  // primeiro fixa o buffer como ArrayBuffer, que é o que `applicationServerKey`
  // (BufferSource) aceita — o segundo infere ArrayBufferLike e não compila.
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }

  return output;
}

interface NavigatorWithStandalone extends Navigator {
  /** Só existe no Safari iOS: true quando aberto da tela de início. */
  standalone?: boolean;
}

export function isIosDevice(nav: Navigator = navigator): boolean {
  const ua = nav.userAgent ?? '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ se apresenta como Macintosh; o touch denuncia.
  return ua.includes('Macintosh') && (nav.maxTouchPoints ?? 0) > 1;
}

export function isStandaloneDisplay(win: Window = window): boolean {
  const nav = win.navigator as NavigatorWithStandalone | undefined;
  if (nav?.standalone === true) return true;

  if (typeof win.matchMedia !== 'function') return false;
  try {
    return win.matchMedia('(display-mode: standalone)').matches;
  } catch (error) {
    return false;
  }
}

/**
 * Descobre se dá para pedir push neste ambiente. Nunca lança: em ambiente
 * incapaz a UI mostra explicação, não um toggle quebrado.
 */
export function detectPushAvailability(win: Window = window): PushAvailability {
  if (win.isSecureContext === false) {
    return {status: 'unsupported', reason: 'insecure-context'};
  }

  const nav = win.navigator;
  const missing: PushUnsupportedReason | null = !('serviceWorker' in nav)
    ? 'no-service-worker'
    : !('PushManager' in win)
      ? 'no-push-manager'
      : !('Notification' in win)
        ? 'no-notification-api'
        : null;

  if (!missing) return {status: 'supported'};

  // Safari iOS fora da tela de início: não é "navegador sem suporte", é
  // "falta instalar" — mensagem acionável em vez de beco sem saída.
  if (isIosDevice(nav) && !isStandaloneDisplay(win)) {
    return {status: 'ios-install-required'};
  }

  return {status: 'unsupported', reason: missing};
}
