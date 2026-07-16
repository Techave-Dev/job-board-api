import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { ApplicationsService } from './applications.service';
import { IApplicationsRepository } from './interfaces/applications.repository.interface';
import { ICompaniesService } from '../companies/interfaces/companies.service.interface';
import { IStorageService } from '../storage/interfaces/storage.service.interface';
import { INotificationsService } from '../notifications/interfaces/notifications.service.interface';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  const mockRepository = mock<IApplicationsRepository>();
  const mockCompaniesService = {
    findByUserId: jest.fn(),
    findById: jest.fn(),
  };
  const mockStorageService = {
    upload: jest.fn().mockResolvedValue(undefined),
    getPresignedUrl: jest.fn().mockResolvedValue('http://minio/presigned-url'),
  };
  const mockNotificationsService = {
    findAll: jest.fn(),
    markAsRead: jest.fn(),
    createAndEmit: jest.fn().mockResolvedValue({
      id: '1',
      userId: '1',
      type: 'new_application',
      message: 'test',
      read: false,
      data: {},
      createdAt: new Date(),
    }),
  };

  const file = {
    buffer: Buffer.from('fake-pdf'),
    mimetype: 'application/pdf',
    originalname: 'resume.pdf',
    size: 2048,
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: IApplicationsRepository, useValue: mockRepository },
        { provide: ICompaniesService, useValue: mockCompaniesService },
        { provide: IStorageService, useValue: mockStorageService },
        { provide: INotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get(ApplicationsService);
    jest.clearAllMocks();
  });

  describe('apply', () => {
    it('should upload resume and create application with presigned url', async () => {
      mockRepository.getJobCompanyId.mockResolvedValue('10');
      mockRepository.create.mockResolvedValue({
        id: '1',
        jobId: '5',
        userId: '1',
        status: 'pending',
        resumeUrl: 'resumes/1_1234567890.pdf',
        createdAt: new Date(),
      });

      const result = await service.apply('1', '5', file);

      expect(result.resumeUrl).toBe('http://minio/presigned-url');
      expect(mockStorageService.upload).toHaveBeenCalledWith(
        expect.stringMatching(/^resumes\/1_/),
        file.buffer,
        'application/pdf',
      );
      expect(mockRepository.create).toHaveBeenCalledWith({
        jobId: '5',
        userId: '1',
        resumeUrl: expect.stringMatching(/^resumes\/1_/),
      });
    });

    it('should throw NotFoundException when job not found', async () => {
      mockRepository.getJobCompanyId.mockResolvedValue(null);

      await expect(service.apply('1', '999', file)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockStorageService.upload).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when already applied (P2002)', async () => {
      mockRepository.getJobCompanyId.mockResolvedValue('10');
      mockRepository.create.mockRejectedValue(
        Object.assign(new Error('P2002 Unique constraint failed'), {
          code: 'P2002',
        }),
      );

      await expect(service.apply('1', '5', file)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('listMine', () => {
    it('should return shaped list with nested job and company', async () => {
      mockRepository.listByUserId.mockResolvedValue([
        {
          id: '1',
          jobId: '5',
          userId: '1',
          status: 'pending',
          resumeUrl: 'resumes/1_123.pdf',
          createdAt: new Date(),
          updatedAt: new Date(),
          jobTitle: 'Frontend Dev',
          companyId: '10',
          companyName: 'Tech Corp',
        },
      ]);
      mockRepository.countByUserId.mockResolvedValue(1);

      const result = await service.listMine('1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: '1',
        jobId: '5',
        status: 'pending',
        resumeUrl: 'resumes/1_123.pdf',
        createdAt: expect.any(Date),
        job: {
          id: '5',
          title: 'Frontend Dev',
          company: { id: '10', name: 'Tech Corp' },
        },
      });
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1 });
    });
  });

  describe('listForJob', () => {
    const existingCompany = {
      id: '10',
      userId: '1',
      name: 'Tech Corp',
      description: null,
      logoUrl: null,
      website: null,
      createdAt: new Date(),
    };

    it('should return shaped list with nested user for owner company', async () => {
      mockRepository.getJobCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(existingCompany);
      mockRepository.listByJobId.mockResolvedValue([
        {
          id: '1',
          jobId: '5',
          userId: '2',
          status: 'pending',
          resumeUrl: 'resumes/2_123.pdf',
          createdAt: new Date(),
          updatedAt: new Date(),
          userName: 'Applicant One',
          userEmail: 'applicant@test.com',
        },
      ]);
      mockRepository.countByJobId.mockResolvedValue(1);

      const result = await service.listForJob('5', '1', { page: 1, limit: 20 });

      expect(result.data[0]).toEqual({
        id: '1',
        userId: '2',
        status: 'pending',
        resumeUrl: 'resumes/2_123.pdf',
        createdAt: expect.any(Date),
        user: { id: '2', name: 'Applicant One', email: 'applicant@test.com' },
      });
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1 });
    });

    it('should throw NotFoundException when job not found', async () => {
      mockRepository.getJobCompanyId.mockResolvedValue(null);

      await expect(
        service.listForJob('999', '1', { page: 1, limit: 20 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when company not found', async () => {
      mockRepository.getJobCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(null);

      await expect(
        service.listForJob('5', '1', { page: 1, limit: 20 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockRepository.getJobCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(existingCompany);

      await expect(
        service.listForJob('5', '999', { page: 1, limit: 20 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateStatus', () => {
    const existingCompany = {
      id: '10',
      userId: '1',
      name: 'Tech Corp',
      description: null,
      logoUrl: null,
      website: null,
      createdAt: new Date(),
    };

    it('should update status and return shaped result without updatedAt', async () => {
      mockRepository.findById.mockResolvedValue({
        id: '1',
        jobId: '5',
        userId: '2',
        status: 'pending',
        resumeUrl: 'resumes/2_123.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockRepository.getJobCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(existingCompany);
      mockRepository.updateStatus.mockResolvedValue({
        id: '1',
        jobId: '5',
        userId: '2',
        status: 'reviewed',
        resumeUrl: 'resumes/2_123.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateStatus('1', '1', 'reviewed');

      expect(result.status).toBe('reviewed');
      expect(result).not.toHaveProperty('updatedAt');
      expect(mockRepository.updateStatus).toHaveBeenCalledWith('1', 'reviewed');
    });

    it('should throw NotFoundException when application not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus('999', '1', 'reviewed'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not job owner', async () => {
      mockRepository.findById.mockResolvedValue({
        id: '1',
        jobId: '5',
        userId: '2',
        status: 'pending',
        resumeUrl: 'resumes/2_123.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockRepository.getJobCompanyId.mockResolvedValue('10');
      mockCompaniesService.findById.mockResolvedValue(existingCompany);

      await expect(
        service.updateStatus('1', '999', 'reviewed'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
