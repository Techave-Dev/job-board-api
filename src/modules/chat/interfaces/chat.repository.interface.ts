export interface ChatMessage {
  id: string;
  applicationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export interface ChatAccessInfo {
  applicationId: string;
  applicantUserId: string;
  companyUserId: string;
}

export interface CreateChatMessageInput {
  applicationId: string;
  senderId: string;
  content: string;
}

export const IChatRepository = Symbol('IChatRepository');

export interface IChatRepository {
  create(input: CreateChatMessageInput): Promise<ChatMessage>;
  listByApplicationId(
    applicationId: string,
    limit: number,
    offset: number,
  ): Promise<ChatMessage[]>;
  countByApplicationId(applicationId: string): Promise<number>;
  getAccessInfo(applicationId: string): Promise<ChatAccessInfo | null>;
}
