import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { NotificationPubSubService } from './notification-pubsub.service';
import { INotificationsService } from './interfaces/notifications.service.interface';
import { INotificationsRepository } from './interfaces/notifications.repository.interface';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationPubSubService,
    {
      provide: INotificationsService,
      useClass: NotificationsService,
    },
    {
      provide: INotificationsRepository,
      useClass: NotificationsRepository,
    },
  ],
  exports: [INotificationsService],
})
export class NotificationsModule {}
