import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Subject, Observable } from 'rxjs';
import { NotificationType } from './interfaces/notifications.repository.interface';

export interface SseNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  createdAt: string;
}

interface RedisMessage {
  userId: string;
  payload: SseNotificationPayload;
}

function isRedisMessage(obj: unknown): obj is RedisMessage {
  if (!obj || typeof obj !== 'object') return false;
  const candidate = obj as Record<string, unknown>;
  return (
    typeof candidate.userId === 'string' &&
    typeof candidate.payload === 'object'
  );
}

@Injectable()
export class NotificationPubSubService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly publisher: Redis;
  private readonly subscriber: Redis;
  private readonly notificationSubject$ = new Subject<RedisMessage>();

  constructor(private readonly configService: ConfigService) {
    const redisOptions = {
      host: this.configService.get<string>('REDIS_HOST') ?? 'localhost',
      port: this.configService.get<number>('REDIS_PORT') ?? 6379,
    };

    this.publisher = new Redis(redisOptions);
    this.subscriber = new Redis(redisOptions);
  }

  async onModuleInit(): Promise<void> {
    await this.subscriber.subscribe('job-board:notifications');
    this.subscriber.on('message', (channel: string, message: string) => {
      if (channel === 'job-board:notifications') {
        try {
          const parsed: unknown = JSON.parse(message);
          if (isRedisMessage(parsed)) {
            this.notificationSubject$.next(parsed);
          }
        } catch (error) {
          console.error(
            'Failed to parse inbound Redis notification message:',
            error,
          );
        }
      }
    });
  }

  async publish(
    userId: string,
    payload: SseNotificationPayload,
  ): Promise<void> {
    const message = JSON.stringify({ userId, payload });
    await this.publisher.publish('job-board:notifications', message);
  }

  getNotificationStream(): Observable<RedisMessage> {
    return this.notificationSubject$.asObservable();
  }

  async onModuleDestroy(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}
