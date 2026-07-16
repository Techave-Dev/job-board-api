import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { nullableParam } from '../../common/utils/typed-sql.util';
import {
  INotificationsRepository,
  NotificationOwnerCheck,
  CreateNotificationInput,
} from './interfaces/notifications.repository.interface';
import {
  Notification,
  NotificationType,
  JsonValue,
} from './interfaces/notifications.repository.interface';
import {
  createNotification,
  listNotificationsByUserId,
  countNotificationsByUserId,
  countUnreadNotificationsByUserId,
  getNotificationById,
  markNotificationRead,
} from '../../generated/prisma/sql';

function safeMapJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(safeMapJsonValue);
  }

  if (value && typeof value === 'object') {
    const obj: { [key: string]: JsonValue } = {};

    const keys = Reflect.ownKeys(value);
    for (const key of keys) {
      if (typeof key === 'string') {
        if (key in value) {
          const element = (value as Record<PropertyKey, unknown>)[key];
          obj[key] = safeMapJsonValue(element);
        }
      }
    }
    return obj;
  }

  return null;
}

@Injectable()
export class NotificationsRepository implements INotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    const [notification] = await this.prisma.$queryRawTyped(
      createNotification(
        BigInt(input.userId),
        input.type,
        input.title,
        input.message,
        JSON.stringify(input.data),
      ),
    );

    if (!notification) {
      throw new InternalServerErrorException('Failed to create notification');
    }

    return this.toDomain(notification);
  }

  async listByUserId(
    userId: string,
    unread: boolean | null,
    limit: number,
    offset: number,
  ): Promise<Notification[]> {
    const rows = await this.prisma.$queryRawTyped(
      listNotificationsByUserId(
        BigInt(userId),
        nullableParam(unread),
        limit,
        offset,
      ),
    );

    return rows.map((row) => this.toDomain(row));
  }

  async countByUserId(userId: string, unread: boolean | null): Promise<number> {
    const [result] = await this.prisma.$queryRawTyped(
      countNotificationsByUserId(BigInt(userId), nullableParam(unread)),
    );
    return Number(result?.total ?? 0);
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    const [result] = await this.prisma.$queryRawTyped(
      countUnreadNotificationsByUserId(BigInt(userId)),
    );
    return Number(result?.unreadCount ?? 0);
  }

  async findById(id: string): Promise<NotificationOwnerCheck | null> {
    const [notification] = await this.prisma.$queryRawTyped(
      getNotificationById(BigInt(id)),
    );
    if (!notification) return null;

    return {
      id: notification.id.toString(),
      userId: notification.userId.toString(),
      read: notification.read,
    };
  }

  async markAsRead(id: string): Promise<Notification> {
    const [notification] = await this.prisma.$queryRawTyped(
      markNotificationRead(BigInt(id)),
    );

    if (!notification) {
      throw new InternalServerErrorException(
        'Failed to mark notification as read',
      );
    }

    return this.toDomain(notification);
  }

  private toDomain(row: {
    id: bigint;
    userId: bigint;
    type: string;
    title: string;
    message: string;
    data: unknown;
    read: boolean;
    createdAt: Date;
  }): Notification {
    const typeCandidate = row.type;
    const cleanType: NotificationType =
      typeCandidate === 'new_job' ||
      typeCandidate === 'new_application' ||
      typeCandidate === 'application_update' ||
      typeCandidate === 'new_message'
        ? typeCandidate
        : 'new_job';

    return {
      id: row.id.toString(),
      userId: row.userId.toString(),
      type: cleanType,
      title: row.title,
      message: row.message,
      data: safeMapJsonValue(row.data),
      read: row.read,
      createdAt: row.createdAt,
    };
  }
}
