import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IChatRepository,
  ChatMessage,
  ChatAccessInfo,
  CreateChatMessageInput,
} from './interfaces/chat.repository.interface';
import {
  createChatMessage,
  listChatMessagesByApplicationId,
  countChatMessagesByApplicationId,
  getChatAccessInfo,
} from '../../generated/prisma/sql';

@Injectable()
export class ChatRepository implements IChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateChatMessageInput): Promise<ChatMessage> {
    const [message] = await this.prisma.$queryRawTyped(
      createChatMessage(
        BigInt(input.applicationId),
        BigInt(input.senderId),
        input.content,
      ),
    );

    if (!message) {
      throw new InternalServerErrorException('Failed to create chat message');
    }

    return this.toDomain(message);
  }

  async listByApplicationId(
    applicationId: string,
    limit: number,
    offset: number,
  ): Promise<ChatMessage[]> {
    const rows = await this.prisma.$queryRawTyped(
      listChatMessagesByApplicationId(BigInt(applicationId), limit, offset),
    );

    return rows.map((row) => this.toDomain(row));
  }

  async countByApplicationId(applicationId: string): Promise<number> {
    const [result] = await this.prisma.$queryRawTyped(
      countChatMessagesByApplicationId(BigInt(applicationId)),
    );
    return Number(result?.total ?? 0);
  }

  async getAccessInfo(applicationId: string): Promise<ChatAccessInfo | null> {
    const [row] = await this.prisma.$queryRawTyped(
      getChatAccessInfo(BigInt(applicationId)),
    );

    if (!row) return null;

    return {
      applicationId: row.applicationId.toString(),
      applicantUserId: row.applicantUserId.toString(),
      companyUserId: row.companyUserId.toString(),
    };
  }

  private toDomain(row: {
    id: bigint;
    applicationId: bigint;
    senderId: bigint;
    content: string;
    createdAt: Date;
  }): ChatMessage {
    return {
      id: row.id.toString(),
      applicationId: row.applicationId.toString(),
      senderId: row.senderId.toString(),
      content: row.content,
      createdAt: row.createdAt,
    };
  }
}
