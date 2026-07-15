import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { mock } from 'jest-mock-extended';
import {
  NotificationPubSubService,
  SseNotificationPayload,
} from './notification-pubsub.service';
import Redis from 'ioredis';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    return {
      subscribe: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(1),
      on: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
    };
  });
});

type RedisMessageCallback = (channel: string, message: string) => void;

function isRedisMessageCallback(fn: unknown): fn is RedisMessageCallback {
  return typeof fn === 'function';
}

interface InternalPubSubService {
  publisher: Redis;
  subscriber: Redis;
}

function castToInternal(service: unknown): InternalPubSubService {
  if (
    service &&
    typeof service === 'object' &&
    'publisher' in service &&
    'subscriber' in service
  ) {
    return service as InternalPubSubService;
  }
  throw new Error('Invalid internal state mapping');
}

describe('NotificationPubSubService', () => {
  let service: NotificationPubSubService;
  const mockConfigService = mock<ConfigService>();

  beforeEach(async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'REDIS_HOST') return 'localhost';
      if (key === 'REDIS_PORT') return 6379;
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPubSubService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<NotificationPubSubService>(NotificationPubSubService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('publish', () => {
    it('should stringify the payload before publishing to the explicit channel', async () => {
      const mockPayload: SseNotificationPayload = {
        type: 'new_job',
        title: 'Test',
        message: 'Hello',
        data: { id: 1 },
        createdAt: '2026-07-12',
      };

      const internalFields = castToInternal(service);
      const publisherSpy = jest.spyOn(internalFields.publisher, 'publish');

      await service.publish('1234567890', mockPayload);

      expect(publisherSpy).toHaveBeenCalledWith(
        'job-board:notifications',
        JSON.stringify({ userId: '1234567890', payload: mockPayload }),
      );
    });
  });

  describe('getNotificationStream', () => {
    it('should push a validated message down the pipeline when redis fires subscription callback', (done) => {
      const payload: SseNotificationPayload = {
        type: 'new_message',
        title: 'Chat',
        message: 'Hi',
        data: {},
        createdAt: '2026-07-12',
      };
      const rawRedisMessage = JSON.stringify({ userId: '1234567890', payload });

      const internalFields = castToInternal(service);
      const subscriberInstance = internalFields.subscriber;
      let registeredCallback: RedisMessageCallback = () => {};

      jest
        .spyOn(subscriberInstance, 'on')
        .mockImplementation(
          (...args: Parameters<(typeof subscriberInstance)['on']>) => {
            const [event, cb] = args;

            if (event === 'message' && isRedisMessageCallback(cb)) {
              registeredCallback = cb;
            }
            return subscriberInstance;
          },
        );

      service
        .onModuleInit()
        .then(() => {
          service.getNotificationStream().subscribe({
            next: (streamedObject) => {
              expect(streamedObject.userId).toBe('1234567890');
              expect(streamedObject.payload.title).toBe('Chat');
              done();
            },
          });

          registeredCallback('job-board:notifications', rawRedisMessage);
        })
        .catch((err: unknown) => done(err));
    });

    it('should completely ignore messages that arrive on a different Redis channel', (done) => {
      const internalFields = castToInternal(service);
      let registeredCallback: RedisMessageCallback = () => {};

      jest
        .spyOn(internalFields.subscriber, 'on')
        .mockImplementation((...args) => {
          const [event, cb] = args;
          if (event === 'message' && isRedisMessageCallback(cb)) {
            registeredCallback = cb;
          }
          return internalFields.subscriber;
        });

      service
        .onModuleInit()
        .then(() => {
          let updateTriggered = false;
          service.getNotificationStream().subscribe({
            next: () => {
              updateTriggered = true;
            },
          });

          registeredCallback(
            'job-board:chat',
            JSON.stringify({ userId: '123', payload: {} }),
          );

          setTimeout(() => {
            expect(updateTriggered).toBe(false);
            done();
          }, 50);
        })
        .catch((err: unknown) => done(err));
    });

    it('should gracefully handle malformed JSON from Redis without breaking the application', (done) => {
      const internalFields = castToInternal(service);
      let registeredCallback: RedisMessageCallback = () => {};

      jest
        .spyOn(internalFields.subscriber, 'on')
        .mockImplementation((...args) => {
          const [event, cb] = args;
          if (event === 'message' && isRedisMessageCallback(cb)) {
            registeredCallback = cb;
          }
          return internalFields.subscriber;
        });

      service
        .onModuleInit()
        .then(() => {
          let isCrashed = false;
          service.getNotificationStream().subscribe({
            error: () => {
              isCrashed = true;
            },
          });

          expect(() => {
            registeredCallback(
              'job-board:notifications',
              'BROKEN_STRING_NOT_JSON',
            );
          }).not.toThrow();

          setTimeout(() => {
            expect(isCrashed).toBe(false);
            done();
          }, 50);
        })
        .catch((err: unknown) => done(err));
    });
  });
});
