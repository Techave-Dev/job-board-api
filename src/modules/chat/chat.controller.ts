import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { IChatService } from './interfaces/chat.service.interface';
import {
  QueryChatMessagesSchema,
  type QueryChatMessagesDto,
} from './dto/query-chat-messages.dto';
import { JwtAuthGuards } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiResponse } from '../../common/types/api-response';

@Controller('chat')
@UseGuards(JwtAuthGuards)
export class ChatController {
  constructor(
    @Inject(IChatService)
    private readonly chatService: IChatService,
  ) {}

  @Get(':applicationId/messages')
  @Roles('company', 'applicant')
  async getMessages(
    @Param('applicationId') applicationId: string,
    @CurrentUser('userId') userId: string,
    @Query(new ZodValidationPipe(QueryChatMessagesSchema))
    query: QueryChatMessagesDto,
  ): Promise<ApiResponse> {
    const result = await this.chatService.getMessages(
      applicationId,
      userId,
      query.page,
      query.limit,
    );
    return new ApiResponse(
      'Messages fetched successfully',
      result.data,
      result.meta,
    );
  }
}
