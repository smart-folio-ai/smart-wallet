import {describe, it, expect} from 'vitest';
import {
  detectPushAvailability,
  isIosDevice,
  isStandaloneDisplay,
  urlBase64ToUint8Array,
} from './web-push';

/** Monta um `window` fake mínimo para a detecção de ambiente. */
function fakeWindow({
  serviceWorker = true,
  pushManager = true,
  notification = true,
  secure = true,
  userAgent = 'Mozilla/5.0 (Windows NT 10.0) Chrome/120',
  maxTouchPoints = 0,
  standalone,
  displayMode = 'browser',
}: {
  serviceWorker?: boolean;
  pushManager?: boolean;
  notification?: boolean;
  secure?: boolean;
  userAgent?: string;
  maxTouchPoints?: number;
  standalone?: boolean;
  displayMode?: string;
} = {}) {
  const nav: Record<string, unknown> = {userAgent, maxTouchPoints};
  if (serviceWorker) nav.serviceWorker = {};
  if (standalone !== undefined) nav.standalone = standalone;

  const win: Record<string, unknown> = {
    navigator: nav,
    isSecureContext: secure,
    matchMedia: (query: string) => ({
      matches: query.includes(displayMode),
    }),
  };
  if (pushManager) win.PushManager = class {};
  if (notification) win.Notification = class {};

  return win as unknown as Window;
}

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1';

describe('urlBase64ToUint8Array', () => {
  it('converte base64url sem padding para os bytes corretos', () => {
    // "Hello" -> base64 "SGVsbG8=" -> base64url "SGVsbG8"
    const result = urlBase64ToUint8Array('SGVsbG8');
    expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
  });

  it('traduz os caracteres -_ do alfabeto base64url', () => {
    // Bytes 0xFB 0xFF 0xFE -> base64 "+//+" -> base64url "-__-"
    const result = urlBase64ToUint8Array('-__-');
    expect(Array.from(result)).toEqual([251, 255, 254]);
  });

  it('produz os 65 bytes de uma chave VAPID P-256 real', () => {
    const vapidKey =
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    expect(urlBase64ToUint8Array(vapidKey)).toHaveLength(65);
  });

  it('rejeita chave vazia', () => {
    expect(() => urlBase64ToUint8Array('')).toThrow(/vazia/i);
    expect(() => urlBase64ToUint8Array('   ')).toThrow(/vazia/i);
  });

  it('rejeita string que não é base64url', () => {
    expect(() => urlBase64ToUint8Array('não é base64!!')).toThrow(/inválida/i);
  });
});

describe('isIosDevice', () => {
  it('detecta iPhone', () => {
    expect(isIosDevice({userAgent: IOS_UA} as Navigator)).toBe(true);
  });

  it('detecta iPadOS 13+, que se apresenta como Macintosh', () => {
    const nav = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605',
      maxTouchPoints: 5,
    } as Navigator;
    expect(isIosDevice(nav)).toBe(true);
  });

  it('não confunde macOS de verdade com iPad', () => {
    const nav = {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605',
      maxTouchPoints: 0,
    } as Navigator;
    expect(isIosDevice(nav)).toBe(false);
  });
});

describe('isStandaloneDisplay', () => {
  it('usa navigator.standalone quando existe (Safari iOS)', () => {
    expect(isStandaloneDisplay(fakeWindow({standalone: true}))).toBe(true);
  });

  it('usa display-mode: standalone nos demais navegadores', () => {
    expect(
      isStandaloneDisplay(fakeWindow({displayMode: 'standalone'})),
    ).toBe(true);
    expect(isStandaloneDisplay(fakeWindow({displayMode: 'browser'}))).toBe(
      false,
    );
  });
});

describe('detectPushAvailability', () => {
  it('reporta suporte quando as três APIs existem em contexto seguro', () => {
    expect(detectPushAvailability(fakeWindow())).toEqual({status: 'supported'});
  });

  it('reporta contexto inseguro antes de qualquer outra checagem', () => {
    expect(detectPushAvailability(fakeWindow({secure: false}))).toEqual({
      status: 'unsupported',
      reason: 'insecure-context',
    });
  });

  it('reporta ausência de service worker', () => {
    expect(detectPushAvailability(fakeWindow({serviceWorker: false}))).toEqual({
      status: 'unsupported',
      reason: 'no-service-worker',
    });
  });

  it('reporta ausência de PushManager', () => {
    expect(detectPushAvailability(fakeWindow({pushManager: false}))).toEqual({
      status: 'unsupported',
      reason: 'no-push-manager',
    });
  });

  it('reporta ausência da Notification API', () => {
    expect(detectPushAvailability(fakeWindow({notification: false}))).toEqual({
      status: 'unsupported',
      reason: 'no-notification-api',
    });
  });

  it('no Safari iOS fora da tela de início pede instalação em vez de dizer "sem suporte"', () => {
    const win = fakeWindow({
      pushManager: false,
      userAgent: IOS_UA,
      standalone: false,
    });
    expect(detectPushAvailability(win)).toEqual({
      status: 'ios-install-required',
    });
  });

  it('no iOS já instalado na tela de início o push é suportado normalmente', () => {
    const win = fakeWindow({userAgent: IOS_UA, standalone: true});
    expect(detectPushAvailability(win)).toEqual({status: 'supported'});
  });
});
