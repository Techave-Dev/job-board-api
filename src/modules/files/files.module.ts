import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { IFilesService } from './interfaces/files.service.interface';
import { CompaniesModule } from '../companies/companies.module';
import { ApplicationsModule } from '../applications/applications.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [CompaniesModule, ApplicationsModule, JobsModule],
  controllers: [FilesController],
  providers: [
    {
      provide: IFilesService,
      useClass: FilesService,
    },
  ],
  exports: [IFilesService],
})
export class FilesModule {}
