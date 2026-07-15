import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  IChatRepository,
  ChatMessage,
  ChatAccessInfo,
} from './interfaces/chat.repository.interface';
import { INotificationsService } from '../notifications/interfaces/notifications.service.interface';
import { Notification } from '../notifications/interfaces/notifications.repository.interface';

describe('ChatService', () => {
  let service: ChatService;
  const mockRepository = mock<IChatRepository>();
  const mockNotificationsService = mock<INotificationsService>();

  const mockAccessInfo: ChatAccessInfo = {
    applicationId: '1',
    applicantUserId: '100',
    companyUserId: '200',
  };

  const mockMessage: ChatMessage = {
    id: '1',
    applicationId: '1',
    senderId: '100',
    content: 'Hello',
    createdAt: new Date(),
  };

  const mockNotification: Notification = {
    id: '1',
    userId: '200',
    type: 'new_message',
    title: 'New message',
    message: 'New message',
    read: false,
    data: { applicationId: '1', senderId: '100' },
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: IChatRepository, useValue: mockRepository },
        { provide: INotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    jest.clearAllMocks();
  });

  describe('getMessages', () => {
    it('should return paginated messages with correct meta', async () => {
      const messages: ChatMessage[] = [mockMessage];
      mockRepository.getAccessInfo.mockResolvedValue(mockAccessInfo);
      mockRepository.listByApplicationId.mockResolvedValue(messages);
      mockRepository.countByApplicationId.mockResolvedValue(1);

      const result = await service.getMessages('1', '100', 1, 50);

      expect(result.data).toEqual(messages);
      expect(result.meta).toEqual({ page: 1, limit: 50, total: 1 });
      expect(mockRepository.listByApplicationId).toHaveBeenCalledWith(
        '1',
        50,
        0,
      );
    });

    it('should calculate offset correctly for page 2', async () => {
      mockRepository.getAccessInfo.mockResolvedValue(mockAccessInfo);
      mockRepository.listByApplicationId.mockResolvedValue([]);
      mockRepository.countByApplicationId.mockResolvedValue(0);

      await service.getMessages('1', '100', 2, 10);

      expect(mockRepository.listByApplicationId).toHaveBeenCalledWith(
        '1',
        10,
        10,
      );
    });

    it('should throw NotFoundException when application not found', async () => {
      mockRepository.getAccessInfo.mockResolvedValue(null);

      await expect(service.getMessages('999', '100', 1, 50)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user has no access', async () => {
      mockRepository.getAccessInfo.mockResolvedValue(mockAccessInfo);

      await expect(service.getMessages('1', '999', 1, 50)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('sendMessage', () => {
    it('should create message and emit notification to company when applicant sends', async () => {
      mockRepository.getAccessInfo.mockResolvedValue(mockAccessInfo);
      mockRepository.create.mockResolvedValue(mockMessage);
      mockNotificationsService.createAndEmit.mockResolvedValue(
        mockNotification,
      );

      const result = await service.sendMessage('1', '100', 'Hello');

      expect(result).toEqual(mockMessage);
      expect(mockRepository.create).toHaveBeenCalledWith({
        applicationId: '1',
        senderId: '100',
        content: 'Hello',
      });
      expect(mockNotificationsService.createAndEmit).toHaveBeenCalledWith(
        '200',
        'new_message',
        'New message',
        { applicationId: '1', senderId: '100' },
      );
    });

    it('should emit notification to applicant when company sends', async () => {
      mockRepository.getAccessInfo.mockResolvedValue(mockAccessInfo);
      mockRepository.create.mockResolvedValue({
        ...mockMessage,
        senderId: '200',
      });
      mockNotificationsService.createAndEmit.mockResolvedValue(
        mockNotification,
      );

      await service.sendMessage('1', '200', 'Hi there');

      expect(mockNotificationsService.createAndEmit).toHaveBeenCalledWith(
        '100',
        'new_message',
        'New message',
        { applicationId: '1', senderId: '200' },
      );
    });

    it('should throw NotFoundException when application not found', async () => {
      mockRepository.getAccessInfo.mockResolvedValue(null);

      await expect(service.sendMessage('999', '100', 'Hello')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user has no access', async () => {
      mockRepository.getAccessInfo.mockResolvedValue(mockAccessInfo);

      await expect(service.sendMessage('1', '999', 'Hello')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('checkAccess', () => {
    it('should return true for applicant', async () => {
      mockRepository.getAccessInfo.mockResolvedValue(mockAccessInfo);

      const result = await service.checkAccess('1', '100');

      expect(result).toBe(true);
    });

    it('should return true for company owner', async () => {
      mockRepository.getAccessInfo.mockResolvedValue(mockAccessInfo);

      const result = await service.checkAccess('1', '200');

      expect(result).toBe(true);
    });

    it('should return false for unauthorized user', async () => {
      mockRepository.getAccessInfo.mockResolvedValue(mockAccessInfo);

      const result = await service.checkAccess('1', '999');

      expect(result).toBe(false);
    });

    it('should return false when application not found', async () => {
      mockRepository.getAccessInfo.mockResolvedValue(null);

      const result = await service.checkAccess('999', '100');

      expect(result).toBe(false);
    });
  });
});
