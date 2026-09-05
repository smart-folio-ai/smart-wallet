import {
  IMarkAllReadResponse,
  INotification,
  INotificationPage,
  IUnreadCountResponse,
  ListNotificationsQuery,
  NotificationServiceInterface,
} from '@/interface/notification';
import {notificationService as apiNotificationService} from '@/server/api/api';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

class NotificationService implements NotificationServiceInterface {
  async list(query: ListNotificationsQuery = {}): Promise<INotificationPage> {
    const response = await apiNotificationService.list({
      limit: Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT),
      ...(query.cursor ? {cursor: query.cursor} : {}),
      ...(query.unreadOnly ? {unreadOnly: true} : {}),
    });
    return response.data;
  }

  async getUnreadCount(): Promise<IUnreadCountResponse> {
    const response = await apiNotificationService.getUnreadCount();
    return response.data;
  }

  async markAsRead(id: string): Promise<INotification> {
    const response = await apiNotificationService.markAsRead(id);
    return response.data;
  }

  async markAllAsRead(): Promise<IMarkAllReadResponse> {
    const response = await apiNotificationService.markAllAsRead();
    return response.data;
  }
}

export default new NotificationService();
