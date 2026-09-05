import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';

/**
 * TRA-136 — testes do serviço de Web Push.
 *
 * jsdom não tem `navigator.serviceWorker` nem `window.PushManager`; ambos são
 * instalados como fakes por teste (`installPushEnvironment`) e removidos no
 * `afterEach`, para que nenhum outro spec herde o ambiente adulterado. O
 * módulo é reimportado a cada teste porque o serviço é singleton e memoiza o
 * registro do service worker.
 */

const getVapidPublicKey = vi.fn();
const registerSubscription = vi.fn();
const removeSubscription = vi.fn();

vi.mock('@/server/api/api', () => ({
  pushNotificationService: {
    getVapidPublicKey: (...args: unknown[]) => getVapidPublicKey(...args),
    registerSubscription: (...args: unknown[]) => registerSubscription(...args),
    removeSubscription: (...args: unknown[]) => removeSubscription(...args),
  },
}));

const VAPID_KEY =
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123';

function fakeSubscription(endpoint = ENDPOINT) {
  return {
    endpoint,
    expirationTime: null,
    toJSON: () => ({
      endpoint,
      expirationTime: null,
      keys: {p256dh: 'p256dh-key', auth: 'auth-key'},
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
}

interface PushEnvironment {
  permission: NotificationPermission;
  requestPermission: ReturnType<typeof vi.fn>;
  getSubscription: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
}

const touchedGlobals: string[] = [];

function define(target: object, key: string, value: unknown) {
  Object.defineProperty(target, key, {
    value,
    configurable: true,
    writable: true,
  });
}

function installPushEnvironment({
  permission = 'default' as NotificationPermission,
  existingSubscription = null as ReturnType<typeof fakeSubscription> | null,
} = {}): PushEnvironment {
  const getSubscription = vi.fn().mockResolvedValue(existingSubscription);
  const subscribe = vi.fn().mockResolvedValue(fakeSubscription());
  const registration = {pushManager: {getSubscription, subscribe}};
  const register = vi.fn().mockResolvedValue(registration);
  const requestPermission = vi.fn().mockResolvedValue('granted');

  define(window, 'isSecureContext', true);
  define(window, 'PushManager', class {});
  define(window, 'Notification', {permission, requestPermission});
  define(navigator, 'serviceWorker', {
    register,
    ready: Promise.resolve(registration),
  });

  touchedGlobals.push('installed');

  return {permission, requestPermission, getSubscription, subscribe, register};
}

async function loadService() {
  vi.resetModules();
  return (await import('./push')).default;
}

async function loadError() {
  return (await import('./push')).PushSubscriptionError;
}

beforeEach(() => {
  vi.clearAllMocks();
  getVapidPublicKey.mockResolvedValue({data: {publicKey: VAPID_KEY}});
  registerSubscription.mockResolvedValue({data: {registered: true}});
  removeSubscription.mockResolvedValue({data: {}});
});

afterEach(() => {
  if (!touchedGlobals.length) return;
  touchedGlobals.length = 0;
  Reflect.deleteProperty(window, 'PushManager');
  Reflect.deleteProperty(window, 'Notification');
  Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('getSubscriptionState', () => {
  it('com permission "default" não registra o service worker nem consulta assinatura', async () => {
    const env = installPushEnvironment({permission: 'default'});
    const service = await loadService();

    await expect(service.getSubscriptionState()).resolves.toEqual({
      permission: 'default',
      subscribed: false,
    });
    expect(env.register).not.toHaveBeenCalled();
    expect(env.requestPermission).not.toHaveBeenCalled();
  });

  it('com permission "denied" reporta não assinado sem pedir nada', async () => {
    const env = installPushEnvironment({permission: 'denied'});
    const service = await loadService();

    await expect(service.getSubscriptionState()).resolves.toEqual({
      permission: 'denied',
      subscribed: false,
    });
    expect(env.requestPermission).not.toHaveBeenCalled();
  });

  it('com permission "granted" e assinatura existente reporta assinado', async () => {
    installPushEnvironment({
      permission: 'granted',
      existingSubscription: fakeSubscription(),
    });
    const service = await loadService();

    await expect(service.getSubscriptionState()).resolves.toEqual({
      permission: 'granted',
      subscribed: true,
    });
  });

  it('em ambiente sem suporte degrada sem lançar', async () => {
    installPushEnvironment({permission: 'granted'});
    Reflect.deleteProperty(window, 'PushManager');
    const service = await loadService();

    await expect(service.getSubscriptionState()).resolves.toEqual({
      permission: 'denied',
      subscribed: false,
    });
  });
});

describe('subscribe', () => {
  it('pede permissão, busca a chave VAPID e faz POST da assinatura', async () => {
    const env = installPushEnvironment({permission: 'default'});
    const service = await loadService();

    await expect(service.subscribe()).resolves.toEqual({
      permission: 'granted',
      subscribed: true,
    });

    expect(env.requestPermission).toHaveBeenCalledTimes(1);
    expect(env.register).toHaveBeenCalledWith('/sw.js', {scope: '/'});
    expect(getVapidPublicKey).toHaveBeenCalledTimes(1);

    const subscribeOptions = env.subscribe.mock.calls[0][0];
    expect(subscribeOptions.userVisibleOnly).toBe(true);
    expect(subscribeOptions.applicationServerKey).toBeInstanceOf(Uint8Array);
    expect(subscribeOptions.applicationServerKey).toHaveLength(65);

    expect(registerSubscription).toHaveBeenCalledWith({
      endpoint: ENDPOINT,
      expirationTime: null,
      keys: {p256dh: 'p256dh-key', auth: 'auth-key'},
    });
  });

  it('não pede permissão de novo quando já concedida', async () => {
    const env = installPushEnvironment({permission: 'granted'});
    const service = await loadService();

    await service.subscribe();

    expect(env.requestPermission).not.toHaveBeenCalled();
    expect(env.subscribe).toHaveBeenCalledTimes(1);
  });

  it('reenvia a assinatura já existente sem recriar nem buscar a chave', async () => {
    const env = installPushEnvironment({
      permission: 'granted',
      existingSubscription: fakeSubscription(),
    });
    const service = await loadService();

    await expect(service.subscribe()).resolves.toEqual({
      permission: 'granted',
      subscribed: true,
    });
    expect(env.subscribe).not.toHaveBeenCalled();
    expect(getVapidPublicKey).not.toHaveBeenCalled();
    expect(registerSubscription).toHaveBeenCalledTimes(1);
  });

  it('lança permission-denied quando o usuário nega o prompt', async () => {
    const env = installPushEnvironment({permission: 'default'});
    env.requestPermission.mockResolvedValue('denied');
    const service = await loadService();
    const PushSubscriptionError = await loadError();

    await expect(service.subscribe()).rejects.toBeInstanceOf(
      PushSubscriptionError,
    );
    expect(registerSubscription).not.toHaveBeenCalled();
  });

  it('lança permission-dismissed quando o usuário fecha o prompt sem escolher', async () => {
    const env = installPushEnvironment({permission: 'default'});
    env.requestPermission.mockResolvedValue('default');
    const service = await loadService();

    await expect(service.subscribe()).rejects.toMatchObject({
      code: 'permission-dismissed',
    });
  });

  it('lança missing-vapid-key quando o backend não devolve a chave', async () => {
    installPushEnvironment({permission: 'granted'});
    getVapidPublicKey.mockResolvedValue({data: {publicKey: ''}});
    const service = await loadService();

    await expect(service.subscribe()).rejects.toMatchObject({
      code: 'missing-vapid-key',
    });
  });

  it('lança unsupported sem tocar na rede em ambiente incapaz', async () => {
    installPushEnvironment({permission: 'granted'});
    Reflect.deleteProperty(navigator, 'serviceWorker');
    const service = await loadService();

    await expect(service.subscribe()).rejects.toMatchObject({
      code: 'unsupported',
    });
    expect(getVapidPublicKey).not.toHaveBeenCalled();
  });
});

describe('unsubscribe', () => {
  it('cancela localmente e faz DELETE com o endpoint', async () => {
    const subscription = fakeSubscription();
    installPushEnvironment({
      permission: 'granted',
      existingSubscription: subscription,
    });
    const service = await loadService();

    await expect(service.unsubscribe()).resolves.toEqual({
      permission: 'granted',
      subscribed: false,
    });

    expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(removeSubscription).toHaveBeenCalledWith(ENDPOINT);
  });

  it('é no-op quando não há assinatura local', async () => {
    installPushEnvironment({permission: 'granted'});
    const service = await loadService();

    await expect(service.unsubscribe()).resolves.toEqual({
      permission: 'granted',
      subscribed: false,
    });
    expect(removeSubscription).not.toHaveBeenCalled();
  });
});
