import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { IApplicationsService } from './interfaces/applications.service.interface';

describe('ApplicationsController', () => {
  let controller: ApplicationsController;

  const mockApplicationsService = {
    apply: jest.fn(),
    listMine: jest.fn(),
    listForJob: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        {
          provide: IApplicationsService,
          useValue: mockApplicationsService,
        },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('apply', () => {
    it('should call applicationsService.apply and return success response', async () => {
      const file = {
        buffer: Buffer.from('fake-pdf'),
        mimetype: 'application/pdf',
        originalname: 'resume.pdf',
        size: 2048,
      } as Express.Multer.File;

      const expectedApplication = {
        id: '1',
        jobId: '5',
        userId: '2',
        status: 'pending',
        resumeUrl: 'http://minio/presigned-url',
        createdAt: new Date(),
      };

      mockApplicationsService.apply.mockResolvedValue(expectedApplication);

      const result = await controller.apply('5', '2', file);

      expect(mockApplicationsService.apply).toHaveBeenCalledWith(
        '2',
        '5',
        file,
      );
      expect(result.message).toBe('Application submitted successfully');
      expect(result.data).toEqual(expectedApplication);
    });
  });

  describe('listMine', () => {
    it('should call applicationsService.listMine and return success response with meta', async () => {
      const query = { page: 1, limit: 20 };

      const expectedResult = {
        data: [
          {
            id: '1',
            jobId: '5',
            status: 'pending',
            resumeUrl: 'resumes/2_123.pdf',
            createdAt: new Date(),
            job: {
              id: '5',
              title: 'Frontend Dev',
              company: { id: '10', name: 'Tech Corp' },
            },
          },
        ],
        meta: { page: 1, limit: 20, total: 1 },
      };

      mockApplicationsService.listMine.mockResolvedValue(expectedResult);

      const result = await controller.listMine('2', query);

      expect(mockApplicationsService.listMine).toHaveBeenCalledWith('2', query);
      expect(result.message).toBe('Applications fetched successfully');
      expect(result.data).toEqual(expectedResult.data);
      expect(result.meta).toEqual(expectedResult.meta);
    });
  });

  describe('listForJob', () => {
    it('should call applicationsService.listForJob and return success response with meta', async () => {
      const query = { page: 1, limit: 20 };

      const expectedResult = {
        data: [
          {
            id: '1',
            userId: '2',
            status: 'pending',
            resumeUrl: 'resumes/2_123.pdf',
            createdAt: new Date(),
            user: {
              id: '2',
              name: 'Applicant One',
              email: 'applicant@test.com',
            },
          },
        ],
        meta: { page: 1, limit: 20, total: 1 },
      };

      mockApplicationsService.listForJob.mockResolvedValue(expectedResult);

      const result = await controller.listForJob('5', '1', query);

      expect(mockApplicationsService.listForJob).toHaveBeenCalledWith(
        '5',
        '1',
        query,
      );
      expect(result.message).toBe('Applications fetched successfully');
      expect(result.data).toEqual(expectedResult.data);
      expect(result.meta).toEqual(expectedResult.meta);
    });
  });

  describe('updateStatus', () => {
    it('should call applicationsService.updateStatus and return success response', async () => {
      const dto = { status: 'reviewed' as const };

      const expectedApplication = {
        id: '1',
        jobId: '5',
        userId: '2',
        status: 'reviewed',
        resumeUrl: 'resumes/2_123.pdf',
        createdAt: new Date(),
      };

      mockApplicationsService.updateStatus.mockResolvedValue(
        expectedApplication,
      );

      const result = await controller.updateStatus('1', '1', dto);

      expect(mockApplicationsService.updateStatus).toHaveBeenCalledWith(
        '1',
        '1',
        'reviewed',
      );
      expect(result.message).toBe('Application status updated successfully');
      expect(result.data).toEqual(expectedApplication);
    });
  });
});
