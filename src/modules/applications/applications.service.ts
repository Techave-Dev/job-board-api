import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ApplicationStatus } from '../../generated/prisma';
import {
  IApplicationsRepository,
  CreatedApplication,
} from './interfaces/applications.repository.interface';
import {
  IApplicationsService,
  ListApplicationsDto,
  ApplicationListResult,
  CompanyApplicationListResult,
} from './interfaces/applications.service.interface';
import { ICompaniesService } from '../companies/interfaces/companies.service.interface';
import { IStorageService } from '../storage/interfaces/storage.service.interface';
import { INotificationsService } from '../notifications/interfaces/notifications.service.interface';

@Injectable()
export class ApplicationsService implements IApplicationsService {
  constructor(
    @Inject(IApplicationsRepository)
    private readonly applicationsRepository: IApplicationsRepository,
    @Inject(ICompaniesService)
    private readonly companiesService: ICompaniesService,
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
    @Inject(INotificationsService)
    private readonly notificationsService: INotificationsService,
  ) {}

  async apply(
    userId: string,
    jobId: string,
    file: Express.Multer.File,
  ): Promise<CreatedApplication> {
    const companyId = await this.applicationsRepository.getJobCompanyId(jobId);
    if (!companyId) {
      throw new NotFoundException({
        code: 'job.not_found',
        message: 'Job not found',
      });
    }

    const ext = file.originalname.split('.').pop();
    const key = `resumes/${userId}_${Date.now()}.${ext}`;
    await this.storageService.upload(key, file.buffer, file.mimetype);

    let application: CreatedApplication;
    try {
      application = await this.applicationsRepository.create({
        jobId,
        userId,
        resumeUrl: key,
      });
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        'code' in err &&
        (err as { code: unknown }).code === 'P2002'
      ) {
        throw new ConflictException({
          code: 'application.already_applied',
          message: 'Already applied',
        });
      }
      throw err;
    }

    const company = await this.companiesService.findById(companyId);
    if (company) {
      await this.notificationsService.createAndEmit(
        company.userId,
        'new_application',
        'A new application was received',
        { applicationId: application.id, jobId: application.jobId },
      );
    }

    const url = await this.storageService.getPresignedUrl(key);
    return { ...application, resumeUrl: url };
  }

  async findById(id: string) {
    return this.applicationsRepository.findById(id);
  }

  async listMine(
    userId: string,
    query: ListApplicationsDto,
  ): Promise<ApplicationListResult> {
    const [rows, total] = await Promise.all([
      this.applicationsRepository.listByUserId(userId, query),
      this.applicationsRepository.countByUserId(userId, query),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      status: row.status,
      resumeUrl: row.resumeUrl,
      createdAt: row.createdAt,
      job: {
        id: row.jobId,
        title: row.jobTitle,
        company: {
          id: row.companyId,
          name: row.companyName,
        },
      },
    }));

    return { data, meta: { page: query.page, limit: query.limit, total } };
  }

  async listForJob(
    jobId: string,
    userId: string,
    query: ListApplicationsDto,
  ): Promise<CompanyApplicationListResult> {
    await this.assertJobOwnership(jobId, userId);

    const [rows, total] = await Promise.all([
      this.applicationsRepository.listByJobId(jobId, query),
      this.applicationsRepository.countByJobId(jobId, query),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      status: row.status,
      resumeUrl: row.resumeUrl,
      createdAt: row.createdAt,
      user: {
        id: row.userId,
        name: row.userName,
        email: row.userEmail,
      },
    }));

    return { data, meta: { page: query.page, limit: query.limit, total } };
  }

  async updateStatus(id: string, userId: string, status: ApplicationStatus) {
    const application = await this.applicationsRepository.findById(id);
    if (!application) {
      throw new NotFoundException({
        code: 'application.not_found',
        message: 'Application not found',
      });
    }

    await this.assertJobOwnership(application.jobId, userId);
    const updated = await this.applicationsRepository.updateStatus(id, status);

    await this.notificationsService.createAndEmit(
      updated.userId,
      'application_update',
      'Your application status was updated',
      { applicationId: updated.id, status: updated.status },
    );

    return {
      id: updated.id,
      jobId: updated.jobId,
      userId: updated.userId,
      status: updated.status,
      resumeUrl: updated.resumeUrl,
      createdAt: updated.createdAt,
    };
  }

  private async assertJobOwnership(
    jobId: string,
    userId: string,
  ): Promise<void> {
    const companyId = await this.applicationsRepository.getJobCompanyId(jobId);
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
        code: 'application.forbidden',
        message: 'Forbidden',
      });
    }
  }
}
