import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Sse,
  MessageEvent,
  UnauthorizedException,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { INotificationsService } from './interfaces/notifications.service.interface';
import { NotificationPubSubService } from './notification-pubsub.service';
import {
  QueryNotificationSchema,
  type QueryNotificationDto,
} from './dto/query-notification.dto';
import { JwtAuthGuards } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiResponse as ApiRes } from '../../common/types/api-response';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuards)
export class NotificationsController {
  constructor(
    @Inject(INotificationsService)
    private readonly notificationsService: INotificationsService,
    private readonly pubSubService: NotificationPubSubService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default 20)',
  })
  @ApiQuery({
    name: 'unread',
    required: false,
    description: 'Filter: "true" for unread only, "false" for read only',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications fetched successfully',
    content: {
      'application/json': {
        example: {
          message: 'Notifications fetched successfully',
          data: [
            {
              id: 'n1a2b3c4-d5e6-7890-abcd-ef1234567890',
              userId: '550e8400-e29b-41d4-a716-446655440000',
              type: 'application.status',
              title: 'Application Accepted',
              message:
                'Your application to Backend Engineer at Acme Corp has been accepted',
              read: false,
              createdAt: '2025-01-01T00:00:00.000Z',
            },
          ],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    },
  })
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query(new ZodValidationPipe(QueryNotificationSchema))
    query: QueryNotificationDto,
  ) {
    const result = await this.notificationsService.findAll(userId, query);
    return new ApiRes(
      'Notifications fetched successfully',
      result.data,
      result.meta,
    );
  }

  @Patch(':id/read')
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    content: {
      'application/json': {
        example: {
          message: 'Notification marked as read successfully',
          data: {
            id: 'n1a2b3c4-d5e6-7890-abcd-ef1234567890',
            userId: '550e8400-e29b-41d4-a716-446655440000',
            type: 'application.status',
            title: 'Application Accepted',
            message:
              'Your application to Backend Engineer at Acme Corp has been accepted',
            read: true,
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('userId')
    userId: string,
  ) {
    const data = await this.notificationsService.markAsRead(id, userId);
    return new ApiRes('Notification marked as read successfully', data);
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Subscribe to real-time notifications (SSE)' })
  @ApiResponse({
    status: 200,
    description: 'SSE stream of notification events',
  })
  stream(@CurrentUser('userId') userId: string): Observable<MessageEvent> {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.pubSubService.getNotificationStream().pipe(
      filter((message) => message.userId === userId),
      map((message): MessageEvent => {
        return {
          type: 'notification',
          data: JSON.stringify(message.payload),
        };
      }),
    );
  }
}
