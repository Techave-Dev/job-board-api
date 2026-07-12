import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobsRepository } from './jobs.repository';
import { IJobsRepository } from './interfaces/jobs.repository.interface';
import { IJobsService } from './interfaces/jobs.service.interface';
import { CompaniesModule } from '../companies/companies.module';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CompaniesModule, StorageModule, UsersModule, NotificationsModule],
  controllers: [JobsController],
  providers: [
    {
      provide: IJobsRepository,
      useClass: JobsRepository,
    },
    {
      provide: IJobsService,
      useClass: JobsService,
    },
  ],
  exports: [IJobsService],
})
export class JobsModule {}
