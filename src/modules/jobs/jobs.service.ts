import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  IJobsService,
  JobDetail,
  JobListResult,
} from './interfaces/jobs.service.interface';
import { IJobsRepository } from './interfaces/jobs.repository.interface';
import { ICompaniesService } from '../companies/interfaces/companies.service.interface';
import { IStorageService } from '../storage/interfaces/storage.service.interface';
import { ICacheService } from '../cache/interfaces/cache.service.interface';
import { IUsersService } from '../users/interfaces/users.service.interface';
import { INotificationsService } from '../notifications/interfaces/notifications.service.interface';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class JobsService implements IJobsService {
  private readonly logger = new Logger('JobsService');

  constructor(
    @Inject(IJobsRepository)
    private readonly jobsRepository: IJobsRepository,
    @Inject(ICompaniesService)
    private readonly companiesService: ICompaniesService,
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
    @Inject(ICacheService)
    private readonly cacheService: ICacheService,
    @Inject(IUsersService)
    private readonly usersService: IUsersService,
    @Inject(INotificationsService)
    private readonly notificationsService: INotificationsService,
  ) {}

  async create(userId: string, dto: CreateJobDto) {
    const company = await this.companiesService.findByUserId(userId);
    if (!company) {
      throw new ForbiddenException({
        code: 'job.company_not_found',
        message: 'You must have a company profile to create jobs',
      });
    }

    const result = await this.jobsRepository.create({
      companyId: company.id,
      title: dto.title,
      description: dto.description,
      location: dto.location,
      salaryMin: dto.salaryMin,
      salaryMax: dto.salaryMax,
    });

    await this.cacheService.scanAndDelete('jobs:*');

    this.logger.log({
      message: 'Job created',
      jobId: result.id,
      companyId: company.id,
    });

    const applicantIds = await this.usersService.listIdsByRole('applicant');
    await Promise.all(
      applicantIds.map((applicantId) =>
        this.notificationsService.createAndEmit(
          applicantId,
          'new_job',
          'A new job was posted',
          { jobId: result.id },
        ),
      ),
    );

    return result;
  }

  async list(query: PaginationQueryDto): Promise<JobListResult> {
    const cacheKey = this.buildListKey(query);
    const cached = await this.cacheService.get<JobListResult>(cacheKey);
    if (cached) return cached;

    const [data, total] = await Promise.all([
      this.jobsRepository.list(query),
      this.jobsRepository.count(query),
    ]);

    const result: JobListResult = {
      data,
      meta: { page: query.page, limit: query.limit, total },
    };

    await this.cacheService.set(cacheKey, result, 300);

    return result;
  }

  async findById(id: string): Promise<JobDetail> {
    const cacheKey = `jobs:detail:${id}`;
    const cached = await this.cacheService.get<JobDetail>(cacheKey);
    if (cached) return cached;

    const job = await this.jobsRepository.findById(id);
    if (!job) {
      throw new NotFoundException({
        code: 'job.not_found',
        message: 'Job not found',
      });
    }

    const attachments = await this.jobsRepository.listAttachmentsByJobId(id);

    const result: JobDetail = {
      id: job.id,
      companyId: job.companyId,
      title: job.title,
      description: job.description,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      company: {
        id: job.companyId,
        name: job.companyName,
        logoUrl: job.companyLogoUrl,
      },
      attachments,
      _count: { applications: job.applicationCount },
    };

    await this.cacheService.set(cacheKey, result, 600);

    return result;
  }

  async getAttachmentById(id: string) {
    return this.jobsRepository.getAttachmentById(id);
  }

  async updateById(id: string, userId: string, dto: UpdateJobDto) {
    await this.assertOwnership(id, userId);

    const result = await this.jobsRepository.updateById(id, {
      title: dto.title,
      description: dto.description,
      location: dto.location,
      salaryMin: dto.salaryMin,
      salaryMax: dto.salaryMax,
    });

    await this.cacheService.scanAndDelete('jobs:*');

    return result;
  }

  async deleteById(id: string, userId: string) {
    await this.assertOwnership(id, userId);

    const deleted = await this.jobsRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException({
        code: 'job.not_found',
        message: 'Job not found',
      });
    }

    await this.cacheService.scanAndDelete('jobs:*');

    this.logger.log({ message: 'Job deleted', jobId: id });
  }

  async uploadAttachment(
    id: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    await this.assertOwnership(id, userId);

    const ext = file.originalname.split('.').pop();
    const key = `attachments/${id}_${Date.now()}.${ext}`;

    await this.storageService.upload(key, file.buffer, file.mimetype);

    const attachment = await this.jobsRepository.createAttachment({
      jobId: id,
      filename: key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    const url = await this.storageService.getPresignedUrl(key);

    await this.cacheService.del(`jobs:detail:${id}`);

    return { ...attachment, url };
  }

  async deleteAttachment(jobId: string, attachmentId: string, userId: string) {
    const attachment =
      await this.jobsRepository.getAttachmentById(attachmentId);
    if (!attachment || attachment.jobId !== jobId) {
      throw new NotFoundException({
        code: 'attachment.not_found',
        message: 'Attachment not found',
      });
    }

    const company = await this.companiesService.findById(attachment.companyId);

    if (!company) {
      throw new NotFoundException({
        code: 'company.not_found',
        message: 'Company not found',
      });
    }

    if (company.userId !== userId) {
      throw new ForbiddenException({
        code: 'attachment.forbidden',
        message: 'Forbidden',
      });
    }

    const deleted = await this.jobsRepository.deleteAttachment(attachmentId);
    if (!deleted) {
      throw new NotFoundException({
        code: 'attachment.not_found',
        message: 'Attachment not found',
      });
    }

    await this.storageService.delete(attachment.filename);

    await this.cacheService.del(`jobs:detail:${jobId}`);
  }

  private buildListKey(query: PaginationQueryDto): string {
    const normalized = Object.entries(query)
      .filter(([, v]) => v != null)
      .sort(([a], [b]) => a.localeCompare(b));
    const hash = createHash('md5')
      .update(JSON.stringify(normalized))
      .digest('hex');
    return `jobs:${hash}`;
  }

  private async assertOwnership(jobId: string, userId: string) {
    const companyId = await this.jobsRepository.getCompanyId(jobId);
    if (!companyId) {
      throw new NotFoundException({
        code: 'job.not_found',
        message: 'Job not found',
      });
    }

    const company = await this.companiesService.findById(companyId);

    if (!company) {
      throw new NotFoundException({
        code: 'company.not_found',
        message: 'Company not found',
      });
    }

    if (company.userId !== userId) {
      throw new ForbiddenException({
        code: 'job.forbidden',
        message: 'Forbidden',
      });
    }
  }
}
