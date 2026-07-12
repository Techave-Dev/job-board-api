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
import { INotificationsService } from './interfaces/notifications.service.interface';
import { NotificationPubSubService } from './notification-pubsub.service';
import {
  QueryNotificationSchema,
  type QueryNotificationDto,
} from './dto/query-notification.dto';
import { JwtAuthGuards } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ApiResponse } from '../../common/types/api-response';

@Controller('notifications')
@UseGuards(JwtAuthGuards)
export class NotificationsController {
  constructor(
    @Inject(INotificationsService)
    private readonly notificationsService: INotificationsService,
    private readonly pubSubService: NotificationPubSubService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query(new ZodValidationPipe(QueryNotificationSchema))
    query: QueryNotificationDto,
  ) {
    const result = await this.notificationsService.findAll(userId, query);
    return new ApiResponse(
      'Notifications fetched successfully',
      result.data,
      result.meta,
    );
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('userId')
    userId: string,
  ) {
    const data = await this.notificationsService.markAsRead(id, userId);
    return new ApiResponse('Notification marked as read successfully', data);
  }

  @Sse('stream')
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
