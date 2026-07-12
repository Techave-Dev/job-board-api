export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobListItem extends Job {
  companyName: string;
  companyLogoUrl: string | null;
  applicationCount: number;
}

export type CreatedJob = Omit<Job, 'updatedAt'>;

export interface Attachment {
  id: string;
  jobId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface AttachmentWithCompanyId extends Attachment {
  companyId: string;
}

export interface CreatedAttachment extends Attachment {
  createdAt: Date;
}

export interface CreateJobInput {
  companyId: string;
  title: string;
  description: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
}

export interface UpdateJobInput {
  title?: string;
  description?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
}

export interface ListJobsQuery {
  search?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  page: number;
  limit: number;
}

export interface CreateAttachmentInput {
  jobId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export const IJobsRepository = Symbol('IJobsRepository');

export interface IJobsRepository {
  create(data: CreateJobInput): Promise<CreatedJob>;
  list(query: ListJobsQuery): Promise<JobListItem[]>;
  count(query: ListJobsQuery): Promise<number>;
  findById(id: string): Promise<JobListItem | null>;
  getCompanyId(id: string): Promise<string | null>;
  updateById(id: string, data: UpdateJobInput): Promise<Job>;
  deleteById(id: string): Promise<boolean>;
  createAttachment(data: CreateAttachmentInput): Promise<CreatedAttachment>;
  listAttachmentsByJobId(jobId: string): Promise<Attachment[]>;
  getAttachmentById(id: string): Promise<AttachmentWithCompanyId | null>;
  deleteAttachment(id: string): Promise<boolean>;
}
