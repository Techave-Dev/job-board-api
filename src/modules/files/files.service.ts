import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  IFilesService,
  FileType,
  FileUrlResult,
} from './interfaces/files.service.interface';
import { IStorageService } from '../storage/interfaces/storage.service.interface';
import { ICompaniesService } from '../companies/interfaces/companies.service.interface';
import { IApplicationsService } from '../applications/interfaces/applications.service.interface';
import { IJobsService } from '../jobs/interfaces/jobs.service.interface';

const VALID_FILE_TYPES: readonly FileType[] = [
  'resumes',
  'logos',
  'attachments',
];

@Injectable()
export class FilesService implements IFilesService {
  constructor(
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
    @Inject(ICompaniesService)
    private readonly companiesService: ICompaniesService,
    @Inject(IApplicationsService)
    private readonly applicationsService: IApplicationsService,
    @Inject(IJobsService)
    private readonly jobsService: IJobsService,
  ) {}

  async getPresignedUrl(
    type: FileType,
    id: string,
    userId?: string,
    userRole?: string,
  ): Promise<FileUrlResult> {
    if (!VALID_FILE_TYPES.includes(type)) {
      throw new BadRequestException({
        code: 'file.invalid_type',
        message: 'Invalid file type',
      });
    }

    switch (type) {
      case 'logos':
        return this.getLogosUrl(id);
      case 'resumes':
        return this.getResumesUrl(id, userId, userRole);
      case 'attachments':
        return this.getAttachmentsUrl(id, userId);
    }
  }

  private async getLogosUrl(id: string): Promise<FileUrlResult> {
    const company = await this.companiesService.findById(id);
    if (!company) {
      throw new NotFoundException({
        code: 'file.not_found',
        message: 'File not found',
      });
    }

    const key = company.logoUrl;
    if (!key) {
      throw new NotFoundException({
        code: 'file.not_found',
        message: 'File not found',
      });
    }

    const url = await this.storageService.getPresignedUrl(key);
    return { url };
  }

  private async getResumesUrl(
    id: string,
    userId?: string,
    userRole?: string,
  ): Promise<FileUrlResult> {
    if (!userId || !userRole) {
      throw new ForbiddenException({
        code: 'file.forbidden',
        message: 'Forbidden',
      });
    }

    const application = await this.applicationsService.findById(id);
    if (!application) {
      throw new NotFoundException({
        code: 'file.not_found',
        message: 'File not found',
      });
    }

    if (userRole === 'applicant') {
      if (application.userId !== userId) {
        throw new ForbiddenException({
          code: 'file.forbidden',
          message: 'Forbidden',
        });
      }
    } else if (userRole === 'company') {
      const job = await this.jobsService.findById(application.jobId);
      if (!job) {
        throw new ForbiddenException({
          code: 'file.forbidden',
          message: 'Forbidden',
        });
      }
      const company = await this.companiesService.findById(job.company.id);
      if (!company || company.userId !== userId) {
        throw new ForbiddenException({
          code: 'file.forbidden',
          message: 'Forbidden',
        });
      }
    } else {
      throw new ForbiddenException({
        code: 'file.forbidden',
        message: 'Forbidden',
      });
    }

    const key = application.resumeUrl;
    const url = await this.storageService.getPresignedUrl(key);
    return { url };
  }

  private async getAttachmentsUrl(
    id: string,
    userId?: string,
  ): Promise<FileUrlResult> {
    if (!userId) {
      throw new ForbiddenException({
        code: 'file.forbidden',
        message: 'Forbidden',
      });
    }

    const attachment = await this.jobsService.getAttachmentById(id);
    if (!attachment) {
      throw new NotFoundException({
        code: 'file.not_found',
        message: 'File not found',
      });
    }

    const company = await this.companiesService.findById(attachment.companyId);
    if (!company || company.userId !== userId) {
      throw new ForbiddenException({
        code: 'file.forbidden',
        message: 'Forbidden',
      });
    }

    const url = await this.storageService.getPresignedUrl(attachment.filename);
    return { url };
  }
}
