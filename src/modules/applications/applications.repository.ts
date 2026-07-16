import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { nullableParam } from '../../common/utils/typed-sql.util';
import { ApplicationStatus } from '../../generated/prisma';
import {
  IApplicationsRepository,
  CreateApplicationInput,
  ListApplicationsQuery,
  CreatedApplication,
  Application,
  ApplicationListItem,
  ApplicationForCompany,
} from './interfaces/applications.repository.interface';
import {
  createApplication,
  getJobCompanyId,
  getApplicationById,
  listApplicationsByUserId,
  countApplicationsByUserId,
  listApplicationsByJobId,
  countApplicationsByJobId,
  updateApplicationStatus,
} from '../../generated/prisma/sql';

const APPLICATION_STATUS_VALUES: readonly string[] =
  Object.values(ApplicationStatus);

function isApplicationStatus(value: string): value is ApplicationStatus {
  return APPLICATION_STATUS_VALUES.includes(value);
}

function toApplicationStatus(value: string): ApplicationStatus {
  if (!isApplicationStatus(value)) {
    throw new InternalServerErrorException(
      `Unexpected application status from DB: ${value}`,
    );
  }
  return value;
}

@Injectable()
export class ApplicationsRepository implements IApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateApplicationInput): Promise<CreatedApplication> {
    const [application] = await this.prisma.$queryRawTyped(
      createApplication(
        BigInt(data.jobId),
        BigInt(data.userId),
        data.resumeUrl,
      ),
    );

    if (!application) {
      throw new InternalServerErrorException('Failed to create application');
    }

    return {
      id: application.id.toString(),
      jobId: application.jobId.toString(),
      userId: application.userId.toString(),
      status: toApplicationStatus(application.status),
      resumeUrl: application.resumeUrl,
      createdAt: application.createdAt,
    };
  }

  async getJobCompanyId(jobId: string): Promise<string | null> {
    const [result] = await this.prisma.$queryRawTyped(
      getJobCompanyId(BigInt(jobId)),
    );
    if (!result) return null;
    return result.companyId.toString();
  }

  async findById(id: string): Promise<Application | null> {
    const [application] = await this.prisma.$queryRawTyped(
      getApplicationById(BigInt(id)),
    );
    if (!application) return null;

    return {
      id: application.id.toString(),
      jobId: application.jobId.toString(),
      userId: application.userId.toString(),
      status: toApplicationStatus(application.status),
      resumeUrl: application.resumeUrl,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }

  async listByUserId(
    userId: string,
    query: ListApplicationsQuery,
  ): Promise<ApplicationListItem[]> {
    const offset = (query.page - 1) * query.limit;

    const rows = await this.prisma.$queryRawTyped(
      listApplicationsByUserId(
        BigInt(userId),
        nullableParam(query.status),
        query.limit,
        offset,
      ),
    );

    return rows.map((r) => ({
      id: r.id.toString(),
      jobId: r.jobId.toString(),
      userId,
      status: toApplicationStatus(r.status),
      resumeUrl: r.resumeUrl,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      jobTitle: r.jobTitle,
      companyId: r.companyId.toString(),
      companyName: r.companyName,
    }));
  }

  async countByUserId(
    userId: string,
    query: ListApplicationsQuery,
  ): Promise<number> {
    const [result] = await this.prisma.$queryRawTyped(
      countApplicationsByUserId(BigInt(userId), nullableParam(query.status)),
    );
    return Number(result?.total ?? 0);
  }

  async listByJobId(
    jobId: string,
    query: ListApplicationsQuery,
  ): Promise<ApplicationForCompany[]> {
    const offset = (query.page - 1) * query.limit;

    const rows = await this.prisma.$queryRawTyped(
      listApplicationsByJobId(
        BigInt(jobId),
        nullableParam(query.status),
        query.limit,
        offset,
      ),
    );

    return rows.map((r) => ({
      id: r.id.toString(),
      jobId,
      userId: r.userId.toString(),
      status: toApplicationStatus(r.status),
      resumeUrl: r.resumeUrl,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      userName: r.userName,
      userEmail: r.userEmail,
    }));
  }

  async countByJobId(
    jobId: string,
    query: ListApplicationsQuery,
  ): Promise<number> {
    const [result] = await this.prisma.$queryRawTyped(
      countApplicationsByJobId(BigInt(jobId), nullableParam(query.status)),
    );
    return Number(result?.total ?? 0);
  }

  async updateStatus(
    id: string,
    status: ApplicationStatus,
  ): Promise<Application> {
    const [application] = await this.prisma.$queryRawTyped(
      updateApplicationStatus(BigInt(id), status),
    );

    if (!application) {
      throw new InternalServerErrorException(
        'Failed to update application status',
      );
    }

    return {
      id: application.id.toString(),
      jobId: application.jobId.toString(),
      userId: application.userId.toString(),
      status: toApplicationStatus(application.status),
      resumeUrl: application.resumeUrl,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }
}
