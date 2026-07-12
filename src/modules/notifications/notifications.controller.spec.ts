import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { UnauthorizedException } from '@nestjs/common';
import { of } from 'rxjs';
import { NotificationsController } from './notifications.controller';
import { INotificationsService } from './interfaces/notifications.service.interface';
import { NotificationPubSubService, SseNotificationPayload } from './notification-pubsub.service';
import { ApiResponse } from '../../common/types/api-response';
import { Notification } from './interfaces/notifications.repository.interface';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  const mockService = mock<INotificationsService>();
  const mockPubSubService = mock<NotificationPubSubService>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: INotificationsService, useValue: mockService },
        { provide: NotificationPubSubService, useValue: mockPubSubService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return data mapped inside a standard ApiResponse container', async () => {
      const mockResult = {
        data: [],
        meta: { page: 1, limit: 10, total: 0, unreadCount: 0 },
      };
      mockService.findAll.mockResolvedValue(mockResult);

      const response = await controller.findAll('1234567890', { 
        page: 1, 
        limit: 10,
        unread: undefined 
      });

      expect(response).toBeInstanceOf(ApiResponse);
      expect(response.message).toBe('Notifications fetched successfully');
      expect(response.data).toEqual(mockResult.data);
    });
  });

  describe('markAsRead', () => {
    it('should forward request parameters to service layer', async () => {
      const mockNotification: Notification = {
        id: '1',
        userId: '1234567890',
        type: 'new_job',
        title: 'T',
        message: 'M',
        read: true,
        data: null,
        createdAt: new Date(),
      };
      mockService.markAsRead.mockResolvedValue(mockNotification);

      const response = await controller.markAsRead('1', '1234567890');
      expect(response.message).toBe('Notification marked as read successfully');
      expect(response.data).toEqual(mockNotification);
    });
  });

  describe('stream', () => {
    it('should throw UnauthorizedException if user context is empty', () => {
      expect(() => controller.stream('')).toThrow(UnauthorizedException);
    });

    it('should filter stream and transform inbound messages into structured MessageEvent packages', (done) => {
      const payload: SseNotificationPayload = {
        type: 'new_job',
        title: 'T',
        message: 'M',
        data: {},
        createdAt: new Date().toISOString(),
      };

      const mockRedisStream = of(
        { userId: '8888888888', payload },
        { userId: '1234567890', payload },
      );

      mockPubSubService.getNotificationStream.mockReturnValue(mockRedisStream);

      const sseObservable = controller.stream('1234567890');

      sseObservable.subscribe({
        next: (event) => {
          expect(event.type).toBe('notification');
          expect(event.data).toBe(JSON.stringify(payload));
          done();
        },
      });
    });
  });
});