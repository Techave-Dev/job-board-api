import { ApplicationStatus } from '../../../generated/prisma';

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  resumeUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationListItem extends Application {
  jobTitle: string;
  companyId: string;
  companyName: string;
}

export interface ApplicationForCompany extends Application {
  userName: string;
  userEmail: string;
}

export type CreatedApplication = Omit<Application, 'updatedAt'>;

export interface CreateApplicationInput {
  jobId: string;
  userId: string;
  resumeUrl: string;
}

export interface ListApplicationsQuery {
  status?: ApplicationStatus;
  page: number;
  limit: number;
}

export const IApplicationsRepository = Symbol('IApplicationsRepository');

export interface IApplicationsRepository {
  create(data: CreateApplicationInput): Promise<CreatedApplication>;
  getJobCompanyId(jobId: string): Promise<string | null>;
  findById(id: string): Promise<Application | null>;
  listByUserId(
    userId: string,
    query: ListApplicationsQuery,
  ): Promise<ApplicationListItem[]>;
  countByUserId(userId: string, query: ListApplicationsQuery): Promise<number>;
  listByJobId(
    jobId: string,
    query: ListApplicationsQuery,
  ): Promise<ApplicationForCompany[]>;
  countByJobId(jobId: string, query: ListApplicationsQuery): Promise<number>;
  updateStatus(id: string, status: ApplicationStatus): Promise<Application>;
}
