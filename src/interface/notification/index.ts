// TRA-136: contrato da central de notificações in-app.
// Espelha exatamente o DTO exposto pelo backend em GET /notifications.

export interface INotificationAction {
  label: string;
  route: string;
}

export interface INotification {
  id: string;
  type: string;
  title: string;
  body: string;
  /** ISO-8601 */
  createdAt: string;
  /** ISO-8601 ou null enquanto não lida. */
  readAt: string | null;
  /** Ausente quando a notificação não tem ação associada. */
  action?: INotificationAction;
}

export interface INotificationPage {
  items: INotification[];
  nextCursor: string | null;
  unreadCount: number;
}

export interface IUnreadCountResponse {
  unreadCount: number;
}

export interface IMarkAllReadResponse {
  updated: number;
}

export interface ListNotificationsQuery {
  /** Default 20, máximo 50 (validado também no backend). */
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
}

export interface NotificationServiceInterface {
  list(query?: ListNotificationsQuery): Promise<INotificationPage>;
  getUnreadCount(): Promise<IUnreadCountResponse>;
  markAsRead(id: string): Promise<INotification>;
  markAllAsRead(): Promise<IMarkAllReadResponse>;
}

// TRA-136 (fase 6): contrato de Web Push.
// Espelha exatamente os endpoints /notifications/push/* do backend.

export interface IVapidPublicKeyResponse {
  /** Chave pública VAPID em base64url. */
  publicKey: string;
}

/** Shape do `PushSubscription.toJSON()` do navegador — enviado como está. */
export interface IPushSubscriptionPayload {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface IRegisterPushSubscriptionResponse {
  registered: boolean;
}

/** Estado local da assinatura, lido do navegador (não do backend). */
export interface IPushSubscriptionState {
  permission: NotificationPermission;
  subscribed: boolean;
}

export interface PushNotificationServiceInterface {
  getSubscriptionState(): Promise<IPushSubscriptionState>;
  subscribe(): Promise<IPushSubscriptionState>;
  unsubscribe(): Promise<IPushSubscriptionState>;
}
