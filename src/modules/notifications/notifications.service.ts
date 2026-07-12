import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  INotificationsService,
  NotificationListResult,
  NotificationPayloadMap,
  NOTIFICATION_TITLES,
} from './interfaces/notifications.service.interface';
import {
  INotificationsRepository,
  JsonValue,
  Notification,
  NotificationType,
} from './interfaces/notifications.repository.interface';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationPubSubService } from './notification-pubsub.service';

@Injectable()
export class NotificationsService implements INotificationsService {
  constructor(
    @Inject(INotificationsRepository)
    private readonly notificationsRepository: INotificationsRepository,
    private readonly pubSubService: NotificationPubSubService,
  ) {}

  async findAll(
    userId: string,
    query: QueryNotificationDto,
  ): Promise<NotificationListResult> {
    const offset = (query.page - 1) * query.limit;
    const unread = query.unread ?? null;

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationsRepository.listByUserId(
        userId,
        unread,
        query.limit,
        offset,
      ),
      this.notificationsRepository.countByUserId(userId, unread),
      this.notificationsRepository.countUnreadByUserId(userId),
    ]);

    return {
      data: notifications,
      meta: { page: query.page, limit: query.limit, total, unreadCount },
    };
  }

  async markAsRead(id: string, currentUserId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundException({
        code: 'notification.not_found',
        message: 'Notification not found',
      });
    }

    if (notification.userId !== currentUserId) {
      throw new ForbiddenException({
        code: 'notification.forbidden',
        message: 'Forbidden',
      });
    }

    return this.notificationsRepository.markAsRead(id);
  }

  async createAndEmit<T extends NotificationType>(
    userId: string,
    type: T,
    message: string,
    data: NotificationPayloadMap[T],
  ): Promise<Notification> {
    const title = NOTIFICATION_TITLES[type];
    const payload: JsonValue = { ...data };

    const notification = await this.notificationsRepository.create({
      userId,
      type,
      title,
      message,
      data: payload,
    });

    await this.pubSubService.publish(userId, {
      type,
      title,
      message,
      data: payload,
      createdAt: notification.createdAt.toISOString(),
    });

    return notification;
  }
}
