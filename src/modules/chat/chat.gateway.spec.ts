import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import * as jwt from 'jsonwebtoken';
import { ChatGateway } from './chat.gateway';
import { IChatService } from './interfaces/chat.service.interface';
import { IAuthRepository } from '../auth/interfaces/auth.repository.interface';
import { Server, DefaultEventsMap } from 'socket.io';

type MockSocket = {
  id: string;
  handshake: { query: { token?: string } };
  data: { userId?: string; name?: string };
  emit: jest.Mock;
  join: jest.Mock;
  disconnect: jest.Mock;
};

function createMockSocket(
  overrides: Partial<MockSocket> = {},
): MockSocket {
  return {
    id: 'socket-1',
    handshake: { query: {} },
    data: {},
    emit: jest.fn(),
    join: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  };
}

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  const mockChatService = mock<IChatService>();
  const mockAuthRepository = mock<IAuthRepository>();
  const jwtSecret = 'test-secret';

  beforeEach(async () => {
    process.env.JWT_SECRET = jwtSecret;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: IChatService, useValue: mockChatService },
        { provide: IAuthRepository, useValue: mockAuthRepository },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as Server;

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('handleConnection', () => {
    it('should store userId and name on valid token', async () => {
      const token = jwt.sign(
        { sub: '100', email: 'test@test.com' },
        jwtSecret,
      );
      const client = createMockSocket({
        handshake: { query: { token } },
      });
      mockAuthRepository.findById.mockResolvedValue({
        id: '100',
        email: 'test@test.com',
        name: 'Test User',
        role: 'applicant',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await gateway.handleConnection(client as unknown as never);

      expect(client.data.userId).toBe('100');
      expect(client.data.name).toBe('Test User');
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect on missing token', async () => {
      const client = createMockSocket({
        handshake: { query: {} },
      });

      await gateway.handleConnection(client as unknown as never);

      expect(client.emit).toHaveBeenCalledWith('error', {
        message: 'Missing token',
      });
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should disconnect on invalid token', async () => {
      const client = createMockSocket({
        handshake: { query: { token: 'invalid-token' } },
      });

      await gateway.handleConnection(client as unknown as never);

      expect(client.emit).toHaveBeenCalledWith('error', {
        message: 'Invalid token',
      });
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('should disconnect when user not found', async () => {
      const token = jwt.sign(
        { sub: '100', email: 'test@test.com' },
        jwtSecret,
      );
      const client = createMockSocket({
        handshake: { query: { token } },
      });
      mockAuthRepository.findById.mockResolvedValue(null);

      await gateway.handleConnection(client as unknown as never);

      expect(client.emit).toHaveBeenCalledWith('error', {
        message: 'User not found',
      });
      expect(client.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleJoinApplication', () => {
    it('should join room when user has access', async () => {
      const client = createMockSocket();
      client.data.userId = '100';
      mockChatService.checkAccess.mockResolvedValue(true);

      await gateway.handleJoinApplication(
        client as unknown as never,
        { applicationId: '1' },
      );

      expect(client.join).toHaveBeenCalledWith('chat:application:1');
      expect(client.emit).not.toHaveBeenCalled();
    });

    it('should emit error when user has no access', async () => {
      const client = createMockSocket();
      client.data.userId = '100';
      mockChatService.checkAccess.mockResolvedValue(false);

      await gateway.handleJoinApplication(
        client as unknown as never,
        { applicationId: '1' },
      );

      expect(client.emit).toHaveBeenCalledWith('error', {
        message: 'Forbidden',
      });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('should emit error when not authenticated', async () => {
      const client = createMockSocket();

      await gateway.handleJoinApplication(
        client as unknown as never,
        { applicationId: '1' },
      );

      expect(client.emit).toHaveBeenCalledWith('error', {
        message: 'Not authenticated',
      });
    });
  });

  describe('handleSendMessage', () => {
    it('should persist message and broadcast newMessage to room', async () => {
      const client = createMockSocket();
      client.data.userId = '100';
      client.data.name = 'Test User';

      const mockMessage = {
        id: '1',
        applicationId: '1',
        senderId: '100',
        content: 'Hello',
        createdAt: new Date(),
      };

      mockChatService.checkAccess.mockResolvedValue(true);
      mockChatService.sendMessage.mockResolvedValue(mockMessage);

      await gateway.handleSendMessage(
        client as unknown as never,
        { applicationId: '1', content: 'Hello' },
      );

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        '1',
        '100',
        'Hello',
      );
      expect(gateway.server.to).toHaveBeenCalledWith('chat:application:1');
    });

    it('should emit error when not authenticated', async () => {
      const client = createMockSocket();

      await gateway.handleSendMessage(
        client as unknown as never,
        { applicationId: '1', content: 'Hello' },
      );

      expect(client.emit).toHaveBeenCalledWith('error', {
        message: 'Not authenticated',
      });
    });

    it('should emit error when user has no access', async () => {
      const client = createMockSocket();
      client.data.userId = '100';
      mockChatService.checkAccess.mockResolvedValue(false);

      await gateway.handleSendMessage(
        client as unknown as never,
        { applicationId: '1', content: 'Hello' },
      );

      expect(client.emit).toHaveBeenCalledWith('error', {
        message: 'Forbidden',
      });
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });
  });
});
