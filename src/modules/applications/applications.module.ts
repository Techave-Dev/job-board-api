import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationsRepository } from './applications.repository';
import { IApplicationsService } from './interfaces/applications.service.interface';
import { IApplicationsRepository } from './interfaces/applications.repository.interface';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [CompaniesModule],
  controllers: [ApplicationsController],
  providers: [
    {
      provide: IApplicationsService,
      useClass: ApplicationsService,
    },
    {
      provide: IApplicationsRepository,
      useClass: ApplicationsRepository,
    },
  ],
  exports: [IApplicationsService],
})
export class ApplicationsModule {}
