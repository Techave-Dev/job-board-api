import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { IJobsService } from './interfaces/jobs.service.interface';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

describe('JobsController', () => {
  let controller: JobsController;

  const mockJobsService = {
    create: jest.fn(),
    list: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    uploadAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: IJobsService,
          useValue: mockJobsService,
        },
      ],
    }).compile();

    controller = module.get<JobsController>(JobsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call jobsService.create and return success response', async () => {
      const dto: CreateJobDto = {
        title: 'Frontend Dev',
        description: 'React developer',
        location: 'Jakarta',
        salaryMin: 5000000,
        salaryMax: 10000000,
      };

      const expectedJob = {
        id: '100',
        companyId: '10',
        title: 'Frontend Dev',
        description: 'React developer',
        location: 'Jakarta',
        salaryMin: 5000000,
        salaryMax: 10000000,
        createdAt: new Date(),
      };

      mockJobsService.create.mockResolvedValue(expectedJob);

      const result = await controller.create('1', dto);

      expect(mockJobsService.create).toHaveBeenCalledWith('1', dto);
      expect(result.message).toBe('Job created successfully');
      expect(result.data).toEqual(expectedJob);
    });
  });

  describe('list', () => {
    it('should call jobsService.list and return success response with meta', async () => {
      const query: PaginationQueryDto = {
        page: 1,
        limit: 20,
        search: undefined,
        location: undefined,
        salaryMin: undefined,
        salaryMax: undefined,
      };

      const expectedResult = {
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

      mockJobsService.list.mockResolvedValue(expectedResult);

      const result = await controller.list(query);

      expect(mockJobsService.list).toHaveBeenCalledWith(query);
      expect(result.message).toBe('Jobs fetched successfully');
      expect(result.data).toEqual(expectedResult.data);
      expect(result.meta).toEqual(expectedResult.meta);
    });
  });

  describe('findById', () => {
    it('should call jobsService.findById and return success response', async () => {
      const expectedJob = {
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

      mockJobsService.findById.mockResolvedValue(expectedJob);

      const result = await controller.findById('1');

      expect(mockJobsService.findById).toHaveBeenCalledWith('1');
      expect(result.message).toBe('Job fetched successfully');
      expect(result.data).toEqual(expectedJob);
    });
  });

  describe('updateById', () => {
    it('should call jobsService.updateById and return success response', async () => {
      const dto: UpdateJobDto = {
        title: 'Updated Title',
      };

      const expectedJob = {
        id: '1',
        companyId: '10',
        title: 'Updated Title',
        description: 'React developer',
        location: null,
        salaryMin: null,
        salaryMax: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockJobsService.updateById.mockResolvedValue(expectedJob);

      const result = await controller.updateById('1', '1', dto);

      expect(mockJobsService.updateById).toHaveBeenCalledWith('1', '1', dto);
      expect(result.message).toBe('Job updated successfully');
      expect(result.data).toEqual(expectedJob);
    });
  });

  describe('deleteById', () => {
    it('should call jobsService.deleteById and return void', async () => {
      mockJobsService.deleteById.mockResolvedValue(undefined);

      const result = await controller.deleteById('1', '1');

      expect(mockJobsService.deleteById).toHaveBeenCalledWith('1', '1');
      expect(result).toBeUndefined();
    });
  });

  describe('uploadAttachment', () => {
    it('should call jobsService.uploadAttachment and return success response', async () => {
      const file = {
        buffer: Buffer.from('fake-pdf'),
        mimetype: 'application/pdf',
        originalname: 'resume.pdf',
        size: 2048,
      } as Express.Multer.File;

      const expectedAttachment = {
        id: '300',
        jobId: '1',
        filename: 'attachments/1_123.pdf',
        originalName: 'resume.pdf',
        mimeType: 'application/pdf',
        size: 2048,
        url: 'http://minio/presigned-url',
        createdAt: new Date(),
      };

      mockJobsService.uploadAttachment.mockResolvedValue(expectedAttachment);

      const result = await controller.uploadAttachment('1', '1', file);

      expect(mockJobsService.uploadAttachment).toHaveBeenCalledWith(
        '1',
        '1',
        file,
      );
      expect(result.message).toBe('Attachment uploaded successfully');
      expect(result.data).toEqual(expectedAttachment);
    });
  });

  describe('deleteAttachment', () => {
    it('should call jobsService.deleteAttachment and return void', async () => {
      mockJobsService.deleteAttachment.mockResolvedValue(undefined);

      const result = await controller.deleteAttachment('1', '300', '1');

      expect(mockJobsService.deleteAttachment).toHaveBeenCalledWith(
        '1',
        '300',
        '1',
      );
      expect(result).toBeUndefined();
    });
  });
});
