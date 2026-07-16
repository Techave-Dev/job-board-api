import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { ChatController } from './chat.controller';
import { IChatService } from './interfaces/chat.service.interface';
import { ApiResponse } from '../../common/types/api-response';
import { ChatMessage } from './interfaces/chat.repository.interface';

describe('ChatController', () => {
  let controller: ChatController;
  const mockService = mock<IChatService>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: IChatService, useValue: mockService }],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    jest.clearAllMocks();
  });

  describe('getMessages', () => {
    it('should return ApiResponse with messages and meta', async () => {
      const mockMessages: ChatMessage[] = [
        {
          id: '1',
          applicationId: '10',
          senderId: '100',
          content: 'Hello',
          createdAt: new Date(),
        },
      ];
      const mockResult = {
        data: mockMessages,
        meta: { page: 1, limit: 50, total: 1 },
      };
      mockService.getMessages.mockResolvedValue(mockResult);

      const response = await controller.getMessages('10', '100', {
        page: 1,
        limit: 50,
      });

      expect(response).toBeInstanceOf(ApiResponse);
      expect(response.message).toBe('Messages fetched successfully');
      expect(response.data).toEqual(mockMessages);
      expect(response.meta).toEqual({ page: 1, limit: 50, total: 1 });
    });

    it('should pass correct parameters to service', async () => {
      mockService.getMessages.mockResolvedValue({
        data: [],
        meta: { page: 2, limit: 10, total: 0 },
      });

      await controller.getMessages('10', '100', { page: 2, limit: 10 });

      expect(mockService.getMessages).toHaveBeenCalledWith('10', '100', 2, 10);
    });
  });
});
