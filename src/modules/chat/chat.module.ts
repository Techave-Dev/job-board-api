import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import { ChatGateway } from './chat.gateway';
import { IChatService } from './interfaces/chat.service.interface';
import { IChatRepository } from './interfaces/chat.repository.interface';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    {
      provide: IChatService,
      useClass: ChatService,
    },
    {
      provide: IChatRepository,
      useClass: ChatRepository,
    },
  ],
  exports: [IChatService],
})
export class ChatModule {}
