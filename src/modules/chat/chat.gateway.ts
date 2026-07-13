import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { Server, Socket, DefaultEventsMap } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { IChatService } from './interfaces/chat.service.interface';
import { IAuthRepository } from '../auth/interfaces/auth.repository.interface';

interface JwtPayload {
  sub: string;
  email: string;
}

interface SocketData {
  userId: string;
  name: string;
}

type ChatSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

function isJwtPayload(decoded: string | jwt.JwtPayload): decoded is JwtPayload {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    'sub' in decoded &&
    'email' in decoded
  );
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly jwtSecret: string;

  constructor(
    @Inject(IChatService)
    private readonly chatService: IChatService,
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    this.jwtSecret = jwtSecret;
  }

  async handleConnection(client: ChatSocket): Promise<void> {
    try {
      const token = client.handshake.query.token;
      if (typeof token !== 'string') {
        client.emit('error', { message: 'Missing token' });
        client.disconnect();
        return;
      }

      const decoded = jwt.verify(token, this.jwtSecret);
      if (!isJwtPayload(decoded)) {
        client.emit('error', { message: 'Invalid token' });
        client.disconnect();
        return;
      }

      const user = await this.authRepository.findById(decoded.sub);
      if (!user) {
        client.emit('error', { message: 'User not found' });
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      client.data.name = user.name;
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: ChatSocket): void {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinApplication')
  async handleJoinApplication(
    client: ChatSocket,
    payload: { applicationId: string },
  ): Promise<void> {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const hasAccess = await this.chatService.checkAccess(
      payload.applicationId,
      userId,
    );
    if (!hasAccess) {
      client.emit('error', { message: 'Forbidden' });
      return;
    }

    const room = `chat:application:${payload.applicationId}`;
    await client.join(room);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: ChatSocket,
    payload: { applicationId: string; content: string },
  ): Promise<void> {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const hasAccess = await this.chatService.checkAccess(
      payload.applicationId,
      userId,
    );
    if (!hasAccess) {
      client.emit('error', { message: 'Forbidden' });
      return;
    }

    const message = await this.chatService.sendMessage(
      payload.applicationId,
      userId,
      payload.content,
    );

    const room = `chat:application:${payload.applicationId}`;
    this.server.to(room).emit('newMessage', {
      id: message.id,
      senderId: message.senderId,
      senderName: client.data.name ?? 'Unknown',
      content: message.content,
      createdAt: message.createdAt,
    });
  }
}
