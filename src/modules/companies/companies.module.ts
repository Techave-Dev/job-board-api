import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompaniesRepository } from './companies.repository';
import { ICompaniesRepository } from './interfaces/companies.repository.interface';
import { ICompaniesService } from './interfaces/companies.service.interface';

@Module({
  controllers: [CompaniesController],
  providers: [
    {
      provide: ICompaniesRepository,
      useClass: CompaniesRepository,
    },
    {
      provide: ICompaniesService,
      useClass: CompaniesService,
    },
  ],
  exports: [ICompaniesService],
})
export class CompaniesModule {}
