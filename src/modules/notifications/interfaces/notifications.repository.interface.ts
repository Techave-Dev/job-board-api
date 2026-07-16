export type NotificationType =
  'new_job' | 'new_application' | 'application_update' | 'new_message';
export type JsonValue =
  string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: JsonValue;
  createdAt: Date;
}

export interface NotificationOwnerCheck {
  id: string;
  userId: string;
  read: boolean;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: JsonValue;
}

export const INotificationsRepository = Symbol('INotificationsRepository');

export interface INotificationsRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
  listByUserId(
    userId: string,
    unread: boolean | null,
    limit: number,
    offset: number,
  ): Promise<Notification[]>;
  countByUserId(userId: string, unread: boolean | null): Promise<number>;
  countUnreadByUserId(userId: string): Promise<number>;
  findById(id: string): Promise<NotificationOwnerCheck | null>;
  markAsRead(id: string): Promise<Notification>;
}
