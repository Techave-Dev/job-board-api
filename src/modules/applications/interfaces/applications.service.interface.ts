import { ApplicationStatus } from '../../../generated/prisma';
import {
  Application,
  CreatedApplication,
} from './applications.repository.interface';

export interface ListApplicationsDto {
  status?: ApplicationStatus;
  page: number;
  limit: number;
}

export interface ApplicationListItemResponse {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  resumeUrl: string;
  createdAt: Date;
  job: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
    };
  };
}

export interface ApplicationForCompanyResponse {
  id: string;
  userId: string;
  status: ApplicationStatus;
  resumeUrl: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface UpdateApplicationStatusResponse {
  id: string;
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  resumeUrl: string;
  createdAt: Date;
}

export interface ApplicationListResult {
  data: ApplicationListItemResponse[];
  meta: { page: number; limit: number; total: number };
}

export interface CompanyApplicationListResult {
  data: ApplicationForCompanyResponse[];
  meta: { page: number; limit: number; total: number };
}

export const IApplicationsService = Symbol('IApplicationsService');

export interface IApplicationsService {
  apply(
    userId: string,
    jobId: string,
    file: Express.Multer.File,
  ): Promise<CreatedApplication>;
  findById(id: string): Promise<Application | null>;
  listMine(
    userId: string,
    query: ListApplicationsDto,
  ): Promise<ApplicationListResult>;
  listForJob(
    jobId: string,
    userId: string,
    query: ListApplicationsDto,
  ): Promise<CompanyApplicationListResult>;
  updateStatus(
    id: string,
    userId: string,
    status: ApplicationStatus,
  ): Promise<UpdateApplicationStatusResponse>;
}
