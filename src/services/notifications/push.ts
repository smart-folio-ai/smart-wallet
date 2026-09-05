import type {
  IPushSubscriptionPayload,
  IPushSubscriptionState,
  PushNotificationServiceInterface,
} from '@/interface/notification';
import {pushNotificationService as apiPushService} from '@/server/api/api';
import {detectPushAvailability, urlBase64ToUint8Array} from '@/lib/web-push';

/**
 * TRA-136 (fase 6) — assinatura de Web Push do navegador.
 *
 * Regra central: NUNCA chamar `Notification.requestPermission()` fora de um
 * gesto explícito do usuário. Um prompt sem contexto é negado, e negar é
 * praticamente permanente (o usuário teria que reabrir nas configurações do
 * navegador). Por isso `subscribe()` só é chamado a partir do toggle.
 */

const SERVICE_WORKER_URL = '/sw.js';
const SERVICE_WORKER_SCOPE = '/';

export class PushSubscriptionError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'unsupported'
      | 'permission-denied'
      | 'permission-dismissed'
      | 'missing-vapid-key'
      | 'subscribe-failed',
  ) {
    super(message);
    this.name = 'PushSubscriptionError';
  }
}

class PushNotificationService implements PushNotificationServiceInterface {
  /** Registro memoizado: `register()` é idempotente, mas a promise não. */
  private registration: Promise<ServiceWorkerRegistration> | null = null;

  private isSupported(): boolean {
    return detectPushAvailability().status === 'supported';
  }

  private getPermission(): NotificationPermission {
    if (typeof Notification === 'undefined') return 'denied';
    return Notification.permission;
  }

  /**
   * Registrar o service worker é o único efeito colateral "de ambiente" desta
   * camada. Fica sob demanda (nunca no boot do app) para que quem não usa
   * push não pague nada por isso.
   */
  private ensureRegistration(): Promise<ServiceWorkerRegistration> {
    if (!this.registration) {
      this.registration = navigator.serviceWorker
        .register(SERVICE_WORKER_URL, {scope: SERVICE_WORKER_SCOPE})
        .then(async (registration) => {
          // `pushManager` só está disponível depois de ativo; sem esperar,
          // a primeira assinatura falha em aba nova.
          await navigator.serviceWorker.ready;
          return registration;
        })
        .catch((error) => {
          this.registration = null;
          throw error;
        });
    }

    return this.registration;
  }

  private toPayload(subscription: PushSubscription): IPushSubscriptionPayload {
    const json = subscription.toJSON();
    const keys = json.keys ?? {};

    return {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime ?? null,
      keys: {p256dh: keys.p256dh ?? '', auth: keys.auth ?? ''},
    };
  }

  async getSubscriptionState(): Promise<IPushSubscriptionState> {
    if (!this.isSupported()) {
      return {permission: 'denied', subscribed: false};
    }

    const permission = this.getPermission();

    // Sem permissão concedida não existe assinatura possível — e não vale
    // registrar o service worker só para descobrir isso.
    if (permission !== 'granted') {
      return {permission, subscribed: false};
    }

    try {
      const registration = await this.ensureRegistration();
      const subscription = await registration.pushManager.getSubscription();
      return {permission, subscribed: Boolean(subscription)};
    } catch (error) {
      return {permission, subscribed: false};
    }
  }

  async subscribe(): Promise<IPushSubscriptionState> {
    if (!this.isSupported()) {
      throw new PushSubscriptionError(
        'Push não é suportado neste ambiente.',
        'unsupported',
      );
    }

    // Só pede se ainda dá: em 'denied' o navegador resolve na hora com
    // 'denied' de novo, sem mostrar nada ao usuário.
    const permission =
      this.getPermission() === 'granted'
        ? 'granted'
        : await Notification.requestPermission();

    if (permission === 'denied') {
      throw new PushSubscriptionError(
        'Permissão de notificações negada.',
        'permission-denied',
      );
    }

    if (permission !== 'granted') {
      throw new PushSubscriptionError(
        'Permissão de notificações não concedida.',
        'permission-dismissed',
      );
    }

    const registration = await this.ensureRegistration();
    const existing = await registration.pushManager.getSubscription();

    if (existing) {
      // Reenvia para o backend: a assinatura pode existir localmente e ter
      // sumido do servidor (troca de conta, limpeza, deploy novo).
      await apiPushService.registerSubscription(this.toPayload(existing));
      return {permission, subscribed: true};
    }

    const {data} = await apiPushService.getVapidPublicKey();
    const publicKey = data?.publicKey;

    if (!publicKey) {
      throw new PushSubscriptionError(
        'Chave VAPID não disponível no servidor.',
        'missing-vapid-key',
      );
    }

    let subscription: PushSubscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    } catch (error) {
      throw new PushSubscriptionError(
        'Não foi possível criar a assinatura de push.',
        'subscribe-failed',
      );
    }

    await apiPushService.registerSubscription(this.toPayload(subscription));

    return {permission, subscribed: true};
  }

  async unsubscribe(): Promise<IPushSubscriptionState> {
    const permission = this.getPermission();

    if (!this.isSupported()) {
      return {permission, subscribed: false};
    }

    const registration = await this.ensureRegistration();
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return {permission, subscribed: false};
    }

    const {endpoint} = subscription;

    // Ordem proposital: cancela local primeiro, para que desligar o toggle
    // pare de receber push mesmo se o backend estiver fora. O endpoint morto
    // devolve 410 no próximo envio e o servidor limpa sozinho.
    await subscription.unsubscribe();
    await apiPushService.removeSubscription(endpoint);

    return {permission, subscribed: false};
  }
}

export default new PushNotificationService();
