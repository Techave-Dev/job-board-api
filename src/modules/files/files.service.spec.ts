import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { IStorageService } from '../storage/interfaces/storage.service.interface';
import { ICompaniesService } from '../companies/interfaces/companies.service.interface';
import { IApplicationsService } from '../applications/interfaces/applications.service.interface';
import { IJobsService } from '../jobs/interfaces/jobs.service.interface';
import { Application } from '../applications/interfaces/applications.repository.interface';
import { CompanyWithJobCount } from '../companies/interfaces/companies.repository.interface';
import { AttachmentWithCompanyId } from '../jobs/interfaces/jobs.repository.interface';

describe('FilesService', () => {
  let service: FilesService;
  const mockStorageService = mock<IStorageService>();
  const mockCompaniesService = mock<ICompaniesService>();
  const mockApplicationsService = mock<IApplicationsService>();
  const mockJobsService = mock<IJobsService>();

  const mockCompany: CompanyWithJobCount = {
    id: '1',
    userId: '100',
    name: 'Test Company',
    description: 'desc',
    logoUrl: 'logos/1_123.jpg',
    website: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    jobCount: 5,
  };

  const mockApplication: Application = {
    id: '1',
    jobId: '10',
    userId: '200',
    status: 'pending',
    resumeUrl: 'resumes/200_123.pdf',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJobDetail = {
    id: '10',
    companyId: '1',
    title: 'Test Job',
    description: 'desc',
    location: null,
    salaryMin: null,
    salaryMax: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    company: { id: '1', name: 'Test Company', logoUrl: null },
    attachments: [],
    _count: { applications: 0 },
  };

  const mockAttachment: AttachmentWithCompanyId = {
    id: '1',
    jobId: '10',
    filename: 'attachments/10_123.pdf',
    originalName: 'doc.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    companyId: '1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: IStorageService, useValue: mockStorageService },
        { provide: ICompaniesService, useValue: mockCompaniesService },
        { provide: IApplicationsService, useValue: mockApplicationsService },
        { provide: IJobsService, useValue: mockJobsService },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    jest.clearAllMocks();
  });

  describe('getPresignedUrl', () => {
    describe('logos', () => {
      it('should return presigned URL for valid company', async () => {
        mockCompaniesService.findById.mockResolvedValue(mockCompany);
        mockStorageService.getPresignedUrl.mockResolvedValue(
          'https://minio.example.com/logos/1_123.jpg',
        );

        const result = await service.getPresignedUrl('logos', '1');

        expect(result).toEqual({
          url: 'https://minio.example.com/logos/1_123.jpg',
        });
        expect(mockCompaniesService.findById).toHaveBeenCalledWith('1');
        expect(mockStorageService.getPresignedUrl).toHaveBeenCalledWith(
          'logos/1_123.jpg',
        );
      });

      it('should throw NotFoundException for non-existent company', async () => {
        mockCompaniesService.findById.mockResolvedValue(null);

        await expect(
          service.getPresignedUrl('logos', '999'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when logoUrl is null', async () => {
        mockCompaniesService.findById.mockResolvedValue({
          ...mockCompany,
          logoUrl: null,
        });

        await expect(
          service.getPresignedUrl('logos', '1'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('resumes', () => {
      it('should return presigned URL for applicant accessing own resume', async () => {
        mockApplicationsService.findById.mockResolvedValue(mockApplication);
        mockStorageService.getPresignedUrl.mockResolvedValue(
          'https://minio.example.com/resumes/200_123.pdf',
        );

        const result = await service.getPresignedUrl(
          'resumes',
          '1',
          '200',
          'applicant',
        );

        expect(result).toEqual({
          url: 'https://minio.example.com/resumes/200_123.pdf',
        });
        expect(mockApplicationsService.findById).toHaveBeenCalledWith('1');
        expect(mockStorageService.getPresignedUrl).toHaveBeenCalledWith(
          'resumes/200_123.pdf',
        );
      });

      it('should return presigned URL for company owner accessing resume', async () => {
        mockApplicationsService.findById.mockResolvedValue(mockApplication);
        mockJobsService.findById.mockResolvedValue(mockJobDetail as never);
        mockCompaniesService.findById.mockResolvedValue(mockCompany);
        mockStorageService.getPresignedUrl.mockResolvedValue(
          'https://minio.example.com/resumes/200_123.pdf',
        );

        const result = await service.getPresignedUrl(
          'resumes',
          '1',
          '100',
          'company',
        );

        expect(result).toEqual({
          url: 'https://minio.example.com/resumes/200_123.pdf',
        });
        expect(mockJobsService.findById).toHaveBeenCalledWith('10');
        expect(mockCompaniesService.findById).toHaveBeenCalledWith('1');
      });

      it('should throw ForbiddenException for applicant accessing other resume', async () => {
        mockApplicationsService.findById.mockResolvedValue(mockApplication);

        await expect(
          service.getPresignedUrl('resumes', '1', '999', 'applicant'),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw ForbiddenException for company owner accessing resume for different job', async () => {
        mockApplicationsService.findById.mockResolvedValue(mockApplication);
        mockJobsService.findById.mockResolvedValue({
          ...mockJobDetail,
          company: { id: '99', name: 'Other', logoUrl: null },
        } as never);
        mockCompaniesService.findById.mockResolvedValue({
          ...mockCompany,
          userId: '999',
        });

        await expect(
          service.getPresignedUrl('resumes', '1', '100', 'company'),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw ForbiddenException when not authenticated', async () => {
        await expect(
          service.getPresignedUrl('resumes', '1'),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw NotFoundException when application not found', async () => {
        mockApplicationsService.findById.mockResolvedValue(null);

        await expect(
          service.getPresignedUrl('resumes', '999', '200', 'applicant'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('attachments', () => {
      it('should return presigned URL for company owner', async () => {
        mockJobsService.getAttachmentById.mockResolvedValue(mockAttachment);
        mockCompaniesService.findById.mockResolvedValue(mockCompany);
        mockStorageService.getPresignedUrl.mockResolvedValue(
          'https://minio.example.com/attachments/10_123.pdf',
        );

        const result = await service.getPresignedUrl(
          'attachments',
          '1',
          '100',
        );

        expect(result).toEqual({
          url: 'https://minio.example.com/attachments/10_123.pdf',
        });
        expect(mockJobsService.getAttachmentById).toHaveBeenCalledWith('1');
        expect(mockCompaniesService.findById).toHaveBeenCalledWith('1');
        expect(mockStorageService.getPresignedUrl).toHaveBeenCalledWith(
          'attachments/10_123.pdf',
        );
      });

      it('should throw ForbiddenException for non-owner', async () => {
        mockJobsService.getAttachmentById.mockResolvedValue(mockAttachment);
        mockCompaniesService.findById.mockResolvedValue(mockCompany);

        await expect(
          service.getPresignedUrl('attachments', '1', '999'),
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw NotFoundException when attachment not found', async () => {
        mockJobsService.getAttachmentById.mockResolvedValue(null);

        await expect(
          service.getPresignedUrl('attachments', '999', '100'),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException when not authenticated', async () => {
        await expect(
          service.getPresignedUrl('attachments', '1'),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('invalid type', () => {
      it('should throw BadRequestException for invalid file type', async () => {
        await expect(
          service.getPresignedUrl('invalid' as never, '1'),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });
});
