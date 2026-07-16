import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { JobsService } from './jobs.service';
import { IJobsRepository } from './interfaces/jobs.repository.interface';
import { ICompaniesService } from '../companies/interfaces/companies.service.interface';
import { IStorageService } from '../storage/interfaces/storage.service.interface';
import { ICacheService } from '../cache/interfaces/cache.service.interface';
import { IUsersService } from '../users/interfaces/users.service.interface';
import { INotificationsService } from '../notifications/interfaces/notifications.service.interface';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('JobsService', () => {
  let service: JobsService;
  const mockRepository = mock<IJobsRepository>();
  const mockCompaniesService = {
    findByUserId: jest.fn(),
    findById: jest.fn(),
  };
  const mockStorageService = {
    upload: jest.fn().mockResolvedValue(undefined),
    getPresignedUrl: jest.fn().mockResolvedValue('http://minio presigned'),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const mockCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    scanAndDelete: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true),
  };
  const mockUsersService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    listIdsByRole: jest.fn().mockResolvedValue([]),
  };
  const mockNotificationsService = {
    findAll: jest.fn(),
    markAsRead: jest.fn(),
    createAndEmit: jest.fn().mockResolvedValue({
      id: '1',
      userId: '1',
      type: 'new_job',
      message: 'test',
      read: false,
      data: {},
      createdAt: new Date(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: IJobsRepository, useValue: mockRepository },
        { provide: ICompaniesService, useValue: mockCompaniesService },
        { provide: IStorageService, useValue: mockStorageService },
        { provide: ICacheService, useValue: mockCacheService },
        { provide: IUsersService, useValue: mockUsersService },
        { provide: INotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get(JobsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create job and return CreatedJob', async () => {
      mockCompaniesService.findByUserId.mockResolvedValue({
        id: '10',
        userId: '1',
        name: 'Tech Corp',
        description: null,
        logoUrl: null,
        website: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        jobCount: 0,
      });
      mockRepository.create.mockResolvedValue({
        id: '100',
        companyId: '10',
        title: 'Frontend Dev',
        description: 'React developer',
        location: 'Jakarta',
        salaryMin: 5000000,
        salaryMax: 10000000,
        createdAt: new Date(),
      });

      const result = await service.create('1', {
        title: 'Frontend Dev',
        description: 'React developer',
        location: 'Jakarta',
        salaryMin: 5000000,
        salaryMax: 10000000,
      });

      expect(result.id).toBe('100');
      expect(result.title).toBe('Frontend Dev');
      expect(mockCompaniesService.findByUserId).toHaveBeenCalledWith('1');
      expect(mockRepository.create).toHaveBeenCalledWith({
        companyId: '10',
        title: 'Frontend Dev',
        description: 'React developer',
        location: 'Jakarta',
        salaryMin: 5000000,
        salaryMax: 10000000,
      });
      expect(mockCacheService.scanAndDelete).toHaveBeenCalledWith('jobs:*');
    });

    it('should throw ForbiddenException if company not found', async () => {
      mockCompaniesService.findByUserId.mockResolvedValue(null);

      await expect(
        service.create('1', {
          title: 'Frontend Dev',
          description: 'React developer',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('list', () => {
    const query = { page: 1, limit: 20 };

    it('should return cached result on cache hit', async () => {
      const cached = {
        data: [
          {
            id: '1',
            companyId: '10',
            companyName: 'Tech Corp',
            companyLogoUrl: null,
            title: 'Frontend Dev',
            description: 'React developer',
            location: null,
            salaryMin: null,
            salaryMax: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            applicationCount: 0,
          },
        ],
        meta: { page: 1, limit: 20, total: 1 },
      };
      mockCacheService.get.mockResolvedValue(cached);

      const result = await service.list(query);

      expect(result).toEqual(cached);
      expect(mockRepository.list).not.toHaveBeenCalled();
      expect(mockRepository.count).not.toHaveBeenCalled();
    });

    it('should query DB and cache result on cache miss', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.list.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const result = await service.list(query);

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 0 });
      expect(mockRepository.list).toHaveBeenCalledWith(query);
      expect(mockRepository.count).toHaveBeenCalledWith(query);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringMatching(/^jobs:/),
        expect.objectContaining({
          data: [],
          meta: { page: 1, limit: 20, total: 0 },
        }),
        300,
      );
    });
  });

  describe('findById', () => {
    it('should return cached job on cache hit', async () => {
      const cachedJob = {
        id: '1',
        companyId: '10',
        title: 'Frontend Dev',
        description: 'React developer',
        location: null,
        salaryMin: null,
        salaryMax: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        company: { id: '10', name: 'Tech Corp', logoUrl: null },
        attachments: [],
        _count: { applications: 0 },
      };
      mockCacheService.get.mockResolvedValue(cachedJob);

      const result = await service.findById('1');

      expect(result).toEqual(cachedJob);
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('should query DB and return job detail on cache miss', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue({
        id: '1',
        companyId: '10',
        companyName: 'Tech Corp',
        companyLogoUrl: null,
        title: 'Frontend Dev',
        description: 'React developer',
        location: 'Jakarta',
        salaryMin: 5000000,
        salaryMax: 10000000,
        createdAt: new Date(),
        updatedAt: new Date(),
        applicationCount: 3,
      });
      mockRepository.listAttachmentsByJobId.mockResolvedValue([
        {
          id: '200',
          jobId: '1',
          filename: 'attachments/1_123.pdf',
          originalName: 'resume.pdf',
          mimeType: 'application/pdf',
          size: 1024,
        },
      ]);

      const result = await service.findById('1');

      expect(result.id).toBe('1');
      expect(result.company.name).toBe('Tech Corp');
      expect(result.attachments).toHaveLength(1);
      expect(result._count.applications).toBe(3);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'jobs:detail:1',
        expect.objectContaining({ id: '1' }),
        600,
      );
    });

    it('should throw NotFoundException when job not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateById', () => {
    const existingCompany = {
      id: '10',
      userId: '1',
      name: 'Tech Corp',
      description: null,
      logoUrl: null,
      website: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobCount: 0,
    };

    it('should update job and return updated job', async () => {
      mockRepository.getCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(existingCompany);
      mockRepository.updateById.mockResolvedValue({
        id: '1',
        companyId: '10',
        title: 'Updated Title',
        description: 'React developer',
        location: null,
        salaryMin: null,
        salaryMax: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateById('1', '1', {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      expect(mockRepository.updateById).toHaveBeenCalledWith('1', {
        title: 'Updated Title',
        description: undefined,
        location: undefined,
        salaryMin: undefined,
        salaryMax: undefined,
      });
      expect(mockCacheService.scanAndDelete).toHaveBeenCalledWith('jobs:*');
    });

    it('should throw NotFoundException when job not found', async () => {
      mockRepository.getCompanyId.mockResolvedValue(null);

      await expect(
        service.updateById('999', '1', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when company not found', async () => {
      mockRepository.getCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(null);

      await expect(
        service.updateById('1', '1', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockRepository.getCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(existingCompany);

      await expect(
        service.updateById('1', '999', { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteById', () => {
    const existingCompany = {
      id: '10',
      userId: '1',
      name: 'Tech Corp',
      description: null,
      logoUrl: null,
      website: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobCount: 0,
    };

    it('should delete job successfully', async () => {
      mockRepository.getCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(existingCompany);
      mockRepository.deleteById.mockResolvedValue(true);

      await service.deleteById('1', '1');

      expect(mockRepository.deleteById).toHaveBeenCalledWith('1');
      expect(mockCacheService.scanAndDelete).toHaveBeenCalledWith('jobs:*');
    });

    it('should throw NotFoundException when job not found for ownership check', async () => {
      mockRepository.getCompanyId.mockResolvedValue(null);

      await expect(service.deleteById('999', '1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockRepository.getCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(existingCompany);

      await expect(service.deleteById('1', '999')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when delete returns false', async () => {
      mockRepository.getCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(existingCompany);
      mockRepository.deleteById.mockResolvedValue(false);

      await expect(service.deleteById('1', '1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('uploadAttachment', () => {
    const existingCompany = {
      id: '10',
      userId: '1',
      name: 'Tech Corp',
      description: null,
      logoUrl: null,
      website: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobCount: 0,
    };

    const file = {
      buffer: Buffer.from('fake-pdf'),
      mimetype: 'application/pdf',
      originalname: 'resume.pdf',
      size: 2048,
    } as Express.Multer.File;

    it('should upload attachment and return with presigned URL', async () => {
      mockRepository.getCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(existingCompany);
      mockRepository.createAttachment.mockResolvedValue({
        id: '300',
        jobId: '1',
        filename: 'attachments/1_123.pdf',
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        createdAt: new Date(),
      });
      mockStorageService.getPresignedUrl.mockResolvedValue(
        'http://minio/presigned-url',
      );

      const result = await service.uploadAttachment('1', '1', file);

      expect(result.id).toBe('300');
      expect(result.url).toBe('http://minio/presigned-url');
      expect(mockStorageService.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^attachments\/1_/),
        file.buffer,
        'application/pdf',
      );
      expect(mockRepository.createAttachment).toHaveBeenCalledWith({
        jobId: '1',
        filename: expect.stringMatching(/^attachments\/1_/),
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 2048,
      });
      expect(mockCacheService.del).toHaveBeenCalledWith('jobs:detail:1');
    });

    it('should throw NotFoundException when job not found', async () => {
      mockRepository.getCompanyId.mockResolvedValue(null);

      await expect(service.uploadAttachment('999', '1', file)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockRepository.getCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(existingCompany);

      await expect(service.uploadAttachment('1', '999', file)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('deleteAttachment', () => {
    const existingCompany = {
      id: '10',
      userId: '1',
      name: 'Tech Corp',
      description: null,
      logoUrl: null,
      website: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobCount: 0,
    };

    it('should delete attachment and remove from storage', async () => {
      mockRepository.getAttachmentById.mockResolvedValue({
        id: '300',
        jobId: '1',
        filename: 'attachments/1_123.pdf',
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        companyId: '10',
      });
      mockCompaniesService.findById.mockResolvedValue(existingCompany);
      mockRepository.deleteAttachment.mockResolvedValue(true);

      await service.deleteAttachment('1', '300', '1');

      expect(mockRepository.deleteAttachment).toHaveBeenCalledWith('300');
      expect(mockStorageService.delete).toHaveBeenCalledWith(
        'attachments/1_123.pdf',
      );
      expect(mockCacheService.del).toHaveBeenCalledWith('jobs:detail:1');
    });

    it('should throw NotFoundException when attachment not found', async () => {
      mockRepository.getAttachmentById.mockResolvedValue(null);

      await expect(service.deleteAttachment('1', '999', '1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when attachment jobId mismatches', async () => {
      mockRepository.getAttachmentById.mockResolvedValue({
        id: '300',
        jobId: '2',
        filename: 'attachments/2_123.pdf',
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        companyId: '10',
      });

      await expect(service.deleteAttachment('1', '300', '1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when company not found', async () => {
      mockRepository.getAttachmentById.mockResolvedValue({
        id: '300',
        jobId: '1',
        filename: 'attachments/1_123.pdf',
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        companyId: '10',
      });
      mockCompaniesService.findById.mockResolvedValue(null);

      await expect(service.deleteAttachment('1', '300', '1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockRepository.getAttachmentById.mockResolvedValue({
        id: '300',
        jobId: '1',
        filename: 'attachments/1_123.pdf',
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        companyId: '10',
      });
      mockCompaniesService.findById.mockResolvedValue(existingCompany);

      await expect(service.deleteAttachment('1', '300', '999')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when deleteAttachment returns false', async () => {
      mockRepository.getAttachmentById.mockResolvedValue({
        id: '300',
        jobId: '1',
        filename: 'attachments/1_123.pdf',
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        companyId: '10',
      });
      mockCompaniesService.findById.mockResolvedValue(existingCompany);
      mockRepository.deleteAttachment.mockResolvedValue(false);

      await expect(service.deleteAttachment('1', '300', '1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
