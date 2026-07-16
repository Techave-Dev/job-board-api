import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  IChatService,
  ChatMessageListResult,
} from './interfaces/chat.service.interface';
import {
  IChatRepository,
  ChatMessage,
  ChatAccessInfo,
} from './interfaces/chat.repository.interface';
import { INotificationsService } from '../notifications/interfaces/notifications.service.interface';

@Injectable()
export class ChatService implements IChatService {
  private readonly logger = new Logger('ChatService');

  constructor(
    @Inject(IChatRepository)
    private readonly chatRepository: IChatRepository,
    @Inject(INotificationsService)
    private readonly notificationsService: INotificationsService,
  ) {}

  async getMessages(
    applicationId: string,
    userId: string,
    page: number,
    limit: number,
  ): Promise<ChatMessageListResult> {
    const accessInfo = await this.chatRepository.getAccessInfo(applicationId);
    if (!accessInfo) {
      throw new NotFoundException({
        code: 'chat.application_not_found',
        message: 'Application not found',
      });
    }

    if (!this.hasAccess(accessInfo, userId)) {
      throw new ForbiddenException({
        code: 'chat.forbidden',
        message: 'Forbidden',
      });
    }

    const offset = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.chatRepository.listByApplicationId(applicationId, limit, offset),
      this.chatRepository.countByApplicationId(applicationId),
    ]);

    return {
      data: messages,
      meta: { page, limit, total },
    };
  }

  async sendMessage(
    applicationId: string,
    senderId: string,
    content: string,
  ): Promise<ChatMessage> {
    const accessInfo = await this.chatRepository.getAccessInfo(applicationId);
    if (!accessInfo) {
      throw new NotFoundException({
        code: 'chat.application_not_found',
        message: 'Application not found',
      });
    }

    if (!this.hasAccess(accessInfo, senderId)) {
      throw new ForbiddenException({
        code: 'chat.forbidden',
        message: 'Forbidden',
      });
    }

    const message = await this.chatRepository.create({
      applicationId,
      senderId,
      content,
    });

    this.logger.log({ message: 'Chat message sent', applicationId, senderId });

    const recipientId =
      senderId === accessInfo.applicantUserId
        ? accessInfo.companyUserId
        : accessInfo.applicantUserId;

    await this.notificationsService.createAndEmit(
      recipientId,
      'new_message',
      'New message',
      { applicationId, senderId },
    );

    return message;
  }

  async checkAccess(applicationId: string, userId: string): Promise<boolean> {
    const accessInfo = await this.chatRepository.getAccessInfo(applicationId);
    if (!accessInfo) return false;
    return this.hasAccess(accessInfo, userId);
  }

  private hasAccess(accessInfo: ChatAccessInfo, userId: string): boolean {
    return (
      userId === accessInfo.applicantUserId ||
      userId === accessInfo.companyUserId
    );
  }
}
