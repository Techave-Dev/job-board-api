import { CreateJobDto } from '../dto/create-job.dto';
import { UpdateJobDto } from '../dto/update-job.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import {
  Job,
  JobListItem,
  Attachment,
  AttachmentWithCompanyId,
  CreatedJob,
  CreatedAttachment,
} from './jobs.repository.interface';

export interface JobDetail extends Job {
  company: { id: string; name: string; logoUrl: string | null };
  attachments: Attachment[];
  _count: { applications: number };
}

export interface JobListResult {
  data: JobListItem[];
  meta: { page: number; limit: number; total: number };
}

export const IJobsService = Symbol('IJobsService');

export interface IJobsService {
  create(userId: string, dto: CreateJobDto): Promise<CreatedJob>;
  list(query: PaginationQueryDto): Promise<JobListResult>;
  findById(id: string): Promise<JobDetail>;
  getAttachmentById(id: string): Promise<AttachmentWithCompanyId | null>;
  updateById(id: string, userId: string, dto: UpdateJobDto): Promise<Job>;
  deleteById(id: string, userId: string): Promise<void>;
  uploadAttachment(
    id: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<CreatedAttachment>;
  deleteAttachment(
    jobId: string,
    attachmentId: string,
    userId: string,
  ): Promise<void>;
}
