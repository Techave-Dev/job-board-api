import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { INotificationsRepository } from './interfaces/notifications.repository.interface';
import { NotificationPubSubService } from './notification-pubsub.service';
import { Notification } from './interfaces/notifications.repository.interface';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const mockRepository = mock<INotificationsRepository>();
  const mockPubSubService = mock<NotificationPubSubService>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: INotificationsRepository, useValue: mockRepository },
        { provide: NotificationPubSubService, useValue: mockPubSubService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated notification list with correct metadata', async () => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          userId: '1234567890',
          type: 'new_job',
          title: 'New job posted',
          message: 'Message',
          read: false,
          data: { jobId: '1' },
          createdAt: new Date(),
        },
      ];

      mockRepository.listByUserId.mockResolvedValue(mockNotifications);
      mockRepository.countByUserId.mockResolvedValue(1);
      mockRepository.countUnreadByUserId.mockResolvedValue(1);

      const result = await service.findAll('1234567890', { page: 1, limit: 10, unread: undefined });

      expect(result.data).toEqual(mockNotifications);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(1);
      expect(result.meta.unreadCount).toBe(1);
      expect(mockRepository.listByUserId).toHaveBeenCalledWith('1234567890', null, 10, 0);
    });

    it('should forward true/false boolean parameters cleanly to the repository layer', async () => {
      mockRepository.listByUserId.mockResolvedValue([]);
      mockRepository.countByUserId.mockResolvedValue(0);
      mockRepository.countUnreadByUserId.mockResolvedValue(0);

      await service.findAll('1234567890', { page: 1, limit: 10, unread: true });
      expect(mockRepository.listByUserId).toHaveBeenCalledWith('1234567890', true, 10, 0);

      await service.findAll('1234567890', { page: 1, limit: 10, unread: false });
      expect(mockRepository.listByUserId).toHaveBeenCalledWith('1234567890', false, 10, 0);
    });
  });

  describe('markAsRead', () => {
    it('should successfully update notification read status if owner matches', async () => {
      const mockOwnerCheck = { id: '1', userId: '1234567890', read: false };
      const mockUpdatedNotification: Notification = {
        id: '1',
        userId: '1234567890',
        type: 'new_job',
        title: 'New job posted',
        message: 'Message',
        read: true,
        data: { jobId: '1' },
        createdAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(mockOwnerCheck);
      mockRepository.markAsRead.mockResolvedValue(mockUpdatedNotification);

      const result = await service.markAsRead('1', '1234567890');
      expect(result.read).toBe(true);
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.markAsRead('1', '1234567890')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockRepository.findById.mockResolvedValue({ id: '1', userId: '8888888888', read: false });

      await expect(service.markAsRead('1', '1234567890')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createAndEmit', () => {
    it('should create database record and trigger publish event through Redis', async () => {
      const mockCreated: Notification = {
        id: '1',
        userId: '1234567890',
        type: 'new_job',
        title: 'New job posted',
        message: 'Check out',
        read: false,
        data: { jobId: '99' },
        createdAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(mockCreated);
      mockPubSubService.publish.mockResolvedValue(undefined);
      const result = await service.createAndEmit(
        '1234567890',
        'new_job',
        'Check out',
        { jobId: '99' },
      );

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockPubSubService.publish).toHaveBeenCalledWith('1234567890', {
        type: 'new_job',
        title: 'New job posted',
        message: 'Check out',
        data: { jobId: '99' },
        createdAt: mockCreated.createdAt.toISOString(),
      });
    });

    it('should abort publishing and throw error if database transaction fails', async () => {
      mockRepository.create.mockRejectedValue(new Error('Database connection timeout'));
      await expect(
        service.createAndEmit(
          '1234567890', 
          'new_job', 
          'Msg', 
          { jobId: '99' }
        )
      ).rejects.toThrow('Database connection timeout');

      expect(mockPubSubService.publish).not.toHaveBeenCalled();
    });
  });
});
