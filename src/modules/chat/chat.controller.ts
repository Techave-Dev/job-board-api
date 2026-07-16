import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { IChatService } from './interfaces/chat.service.interface';
import {
  QueryChatMessagesSchema,
  type QueryChatMessagesDto,
} from './dto/query-chat-messages.dto';
import { JwtAuthGuards } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiResponse as ApiRes } from '../../common/types/api-response';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuards)
export class ChatController {
  constructor(
    @Inject(IChatService)
    private readonly chatService: IChatService,
  ) {}

  @Get(':applicationId/messages')
  @Roles('company', 'applicant')
  @ApiParam({
    name: 'applicationId',
    description: 'Application ID (chat room)',
  })
  @ApiOperation({ summary: 'Get chat messages for an application' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Messages per page (default 50, max 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages fetched successfully',
    content: {
      'application/json': {
        example: {
          message: 'Messages fetched successfully',
          data: [
            {
              id: 'm1a2b3c4-d5e6-7890-abcd-ef1234567890',
              applicationId: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
              senderId: '550e8400-e29b-41d4-a716-446655440000',
              content: 'Hi, I wanted to follow up on my application',
              createdAt: '2025-01-01T00:00:00.000Z',
            },
          ],
          meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Not part of this application',
    content: {
      'application/json': {
        example: {
          statusCode: 403,
          error: 'Forbidden',
          message: ['You are not part of this application'],
        },
      },
    },
  })
  async getMessages(
    @Param('applicationId') applicationId: string,
    @CurrentUser('userId') userId: string,
    @Query(new ZodValidationPipe(QueryChatMessagesSchema))
    query: QueryChatMessagesDto,
  ): Promise<ApiRes> {
    const result = await this.chatService.getMessages(
      applicationId,
      userId,
      query.page,
      query.limit,
    );
    return new ApiRes(
      'Messages fetched successfully',
      result.data,
      result.meta,
    );
  }
}
