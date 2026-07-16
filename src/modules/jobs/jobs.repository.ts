import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  IJobsRepository,
  CreateJobInput,
  UpdateJobInput,
  ListJobsQuery,
  CreateAttachmentInput,
  Job,
  JobListItem,
  CreatedJob,
  Attachment,
  AttachmentWithCompanyId,
  CreatedAttachment,
} from './interfaces/jobs.repository.interface';
import {
  createJob,
  listJobs,
  countJobs,
  getJobById,
  getJobCompanyId,
  updateJob,
  deleteJob,
  createAttachment,
  listAttachmentsByJobId,
  getAttachmentById,
  deleteAttachment,
} from '../../generated/prisma/sql';
import { PrismaService } from '../../prisma/prisma.service';
import { nullableParam } from '../../common/utils/typed-sql.util';

@Injectable()
export class JobsRepository implements IJobsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateJobInput): Promise<CreatedJob> {
    const [job] = await this.prisma.$queryRawTyped(
      createJob(
        BigInt(data.companyId),
        data.title,
        data.description,
        nullableParam(data.location),
        nullableParam(data.salaryMin),
        nullableParam(data.salaryMax),
      ),
    );

    if (!job) {
      throw new InternalServerErrorException('Failed to create job');
    }

    return {
      id: job.id.toString(),
      companyId: job.companyId.toString(),
      title: job.title,
      description: job.description,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      createdAt: job.createdAt,
    };
  }

  async list(query: ListJobsQuery): Promise<JobListItem[]> {
    const offset = (query.page - 1) * query.limit;

    const jobs = await this.prisma.$queryRawTyped(
      listJobs(
        nullableParam(query.search),
        nullableParam(query.location),
        nullableParam(query.salaryMin),
        nullableParam(query.salaryMax),
        query.limit,
        offset,
      ),
    );

    return jobs.map((job) => ({
      id: job.id.toString(),
      companyId: job.companyId.toString(),
      companyName: job.companyName,
      companyLogoUrl: job.companyLogoUrl,
      title: job.title,
      description: job.description,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      applicationCount: Number(job.applicationCount ?? 0),
    }));
  }

  async count(query: ListJobsQuery): Promise<number> {
    const [result] = await this.prisma.$queryRawTyped(
      countJobs(
        nullableParam(query.search),
        nullableParam(query.location),
        nullableParam(query.salaryMin),
        nullableParam(query.salaryMax),
      ),
    );

    return Number(result?.total ?? 0);
  }

  async findById(id: string): Promise<JobListItem | null> {
    const [job] = await this.prisma.$queryRawTyped(getJobById(BigInt(id)));
    if (!job) return null;

    return {
      id: job.id.toString(),
      companyId: job.companyId.toString(),
      companyName: job.companyName,
      companyLogoUrl: job.companyLogoUrl,
      title: job.title,
      description: job.description,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      applicationCount: Number(job.applicationCount ?? 0),
    };
  }

  async getCompanyId(id: string): Promise<string | null> {
    const [result] = await this.prisma.$queryRawTyped(
      getJobCompanyId(BigInt(id)),
    );
    if (!result) return null;

    return result.companyId.toString();
  }

  async updateById(id: string, data: UpdateJobInput): Promise<Job> {
    const [job] = await this.prisma.$queryRawTyped(
      updateJob(
        BigInt(id),
        nullableParam(data.title),
        nullableParam(data.description),
        nullableParam(data.location),
        nullableParam(data.salaryMin),
        nullableParam(data.salaryMax),
      ),
    );

    if (!job) {
      throw new InternalServerErrorException('Failed to update job');
    }

    return {
      id: job.id.toString(),
      companyId: job.companyId.toString(),
      title: job.title,
      description: job.description,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  async deleteById(id: string): Promise<boolean> {
    const [result] = await this.prisma.$queryRawTyped(deleteJob(BigInt(id)));
    return !!result;
  }

  async createAttachment(
    data: CreateAttachmentInput,
  ): Promise<CreatedAttachment> {
    const [attachment] = await this.prisma.$queryRawTyped(
      createAttachment(
        BigInt(data.jobId),
        data.filename,
        data.originalName,
        data.mimeType,
        data.size,
      ),
    );

    if (!attachment) {
      throw new InternalServerErrorException('Failed to create attachment');
    }

    return {
      id: attachment.id.toString(),
      jobId: attachment.jobId.toString(),
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      createdAt: attachment.createdAt,
    };
  }

  async listAttachmentsByJobId(jobId: string): Promise<Attachment[]> {
    const attachments = await this.prisma.$queryRawTyped(
      listAttachmentsByJobId(BigInt(jobId)),
    );

    return attachments.map((a) => ({
      id: a.id.toString(),
      jobId: a.jobId.toString(),
      filename: a.filename,
      originalName: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
    }));
  }

  async getAttachmentById(id: string): Promise<AttachmentWithCompanyId | null> {
    const [attachment] = await this.prisma.$queryRawTyped(
      getAttachmentById(BigInt(id)),
    );
    if (!attachment) return null;

    return {
      id: attachment.id.toString(),
      jobId: attachment.jobId.toString(),
      filename: attachment.filename,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      companyId: attachment.companyId.toString(),
    };
  }

  async deleteAttachment(id: string): Promise<boolean> {
    const [result] = await this.prisma.$queryRawTyped(
      deleteAttachment(BigInt(id)),
    );
    return !!result;
  }
}
