import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CompaniesService } from './companies.service';
import { ICompaniesRepository } from './interfaces/companies.repository.interface';
import { IStorageService } from '../storage/interfaces/storage.service.interface';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;
  const mockRepository = mock<ICompaniesRepository>();
  const mockStorageService = {
    upload: jest.fn(),
    getPresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: ICompaniesRepository, useValue: mockRepository },
        { provide: IStorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get(CompaniesService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a company', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: '1',
        userId: '10',
        name: 'Tech Corp',
        description: 'A tech company',
        logoUrl: null,
        website: 'https://techcorp.com',
        createdAt: new Date(),
      });

      const result = await service.create('10', {
        name: 'Tech Corp',
        description: 'A tech company',
        website: 'https://techcorp.com',
      });

      expect(result.name).toBe('Tech Corp');
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('10');
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: '10',
        name: 'Tech Corp',
        description: 'A tech company',
        website: 'https://techcorp.com',
      });
    });

    it('should throw ConflictException if company already exists', async () => {
      mockRepository.findByUserId.mockResolvedValue({
        id: '1',
        userId: '10',
        name: 'Existing Company',
        description: null,
        logoUrl: null,
        website: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        service.create('10', { name: 'New Company' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('should return company with jobCount', async () => {
      mockRepository.findById.mockResolvedValue({
        id: '1',
        userId: '10',
        name: 'Tech Corp',
        description: 'A tech company',
        logoUrl: null,
        website: 'https://techcorp.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        jobCount: 5,
      });

      const result = await service.findById('1');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Tech Corp');
      expect(result!.jobCount).toBe(5);
    });

    it('should throw NotFoundException if company not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateById', () => {
    const existingCompany = {
      id: '1',
      userId: '10',
      name: 'Tech Corp',
      description: 'A tech company',
      logoUrl: null,
      website: 'https://techcorp.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      jobCount: 0,
    };

    it('should update and return company', async () => {
      mockRepository.findById.mockResolvedValue(existingCompany);
      mockRepository.updateById.mockResolvedValue({
        ...existingCompany,
        name: 'Updated Corp',
      });

      const result = await service.updateById('1', '10', {
        name: 'Updated Corp',
      });

      expect(result.name).toBe('Updated Corp');
      expect(mockRepository.updateById).toHaveBeenCalledWith('1', {
        name: 'Updated Corp',
      });
    });

    it('should throw NotFoundException if company not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateById('999', '10', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      mockRepository.findById.mockResolvedValue(existingCompany);

      await expect(
        service.updateById('1', '999', { name: 'Hacked Name' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('uploadLogo', () => {
    const existingCompany = {
      id: '1',
      userId: '10',
      name: 'Tech Corp',
      description: null,
      logoUrl: null,
      website: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      jobCount: 0,
    };

    it('should upload logo and return presigned URL', async () => {
      mockRepository.findById.mockResolvedValue(existingCompany);
      mockStorageService.upload.mockResolvedValue(undefined);
      mockRepository.updateLogoUrl.mockResolvedValue({
        ...existingCompany,
        logoUrl: 'logos/1_1234567890.jpg',
      });
      mockStorageService.getPresignedUrl.mockResolvedValue(
        'http://minio:9000/job-board-uploads/logos/1_1234567890.jpg',
      );

      const file = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
        originalname: 'logo.jpg',
        size: 1024,
      } as Express.Multer.File;

      const result = await service.uploadLogo('1', '10', file);

      expect(result.logoUrl).toContain('http://minio:9000');
      expect(mockStorageService.upload).toHaveBeenCalled();
      expect(mockRepository.updateLogoUrl).toHaveBeenCalled();
      expect(mockStorageService.getPresignedUrl).toHaveBeenCalled();
    });

    it('should throw NotFoundException if company not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const file = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
        originalname: 'logo.jpg',
        size: 1024,
      } as Express.Multer.File;

      await expect(service.uploadLogo('999', '10', file)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      mockRepository.findById.mockResolvedValue(existingCompany);

      const file = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
        originalname: 'logo.jpg',
        size: 1024,
      } as Express.Multer.File;

      await expect(service.uploadLogo('1', '999', file)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
