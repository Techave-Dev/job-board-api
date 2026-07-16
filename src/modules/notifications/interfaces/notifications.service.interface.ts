import { QueryNotificationDto } from '../dto/query-notification.dto';
import {
  Notification,
  NotificationType,
} from './notifications.repository.interface';

export interface NotificationListResult {
  data: Notification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    unreadCount: number;
  };
}

export interface NotificationPayloadMap {
  new_job: { jobId: string };
  new_application: { applicationId: string; jobId: string };
  application_update: { applicationId: string; status: string };
  new_message: { applicationId: string; senderId: string };
}

export const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  new_job: 'New job posted',
  new_application: 'New application received',
  application_update: 'Application status updated',
  new_message: 'New message',
};

export const INotificationsService = Symbol('INotificationsService');

export interface INotificationsService {
  findAll(
    userId: string,
    query: QueryNotificationDto,
  ): Promise<NotificationListResult>;
  markAsRead(id: string, currentUserId: string): Promise<Notification>;
  createAndEmit<T extends keyof NotificationPayloadMap>(
    userId: string,
    type: T,
    message: string,
    data: NotificationPayloadMap[T],
  ): Promise<Notification>;
}
