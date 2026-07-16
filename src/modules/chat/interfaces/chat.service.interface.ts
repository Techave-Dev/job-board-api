import { ChatMessage } from './chat.repository.interface';

export interface ChatMessageListResult {
  data: ChatMessage[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export const IChatService = Symbol('IChatService');

export interface IChatService {
  getMessages(
    applicationId: string,
    userId: string,
    page: number,
    limit: number,
  ): Promise<ChatMessageListResult>;
  sendMessage(
    applicationId: string,
    senderId: string,
    content: string,
  ): Promise<ChatMessage>;
  checkAccess(applicationId: string, userId: string): Promise<boolean>;
}
