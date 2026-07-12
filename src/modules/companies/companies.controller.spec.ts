import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { ICompaniesService } from './interfaces/companies.service.interface';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

describe('CompaniesController', () => {
  let controller: CompaniesController;

  const mockCompaniesService = {
    create: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    uploadLogo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: ICompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call companiesService.create and return success response', async () => {
      const dto: CreateCompanyDto = {
        name: 'Tech Corp',
        description: 'A tech company',
        website: 'https://techcorp.com',
      };

      const expectedCompany = {
        id: '1',
        userId: '10',
        name: 'Tech Corp',
        description: 'A tech company',
        logoUrl: null,
        website: 'https://techcorp.com',
        createdAt: new Date(),
      };

      mockCompaniesService.create.mockResolvedValue(expectedCompany);

      const result = await controller.create('10', dto);

      expect(mockCompaniesService.create).toHaveBeenCalledWith('10', dto);
      expect(result.message).toBe('Company created successfully');
      expect(result.data).toEqual(expectedCompany);
    });
  });

  describe('findById', () => {
    it('should call companiesService.findById and return success response', async () => {
      const expectedCompany = {
        id: '1',
        userId: '10',
        name: 'Tech Corp',
        description: 'A tech company',
        logoUrl: null,
        website: 'https://techcorp.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        jobCount: 5,
      };

      mockCompaniesService.findById.mockResolvedValue(expectedCompany);

      const result = await controller.findById('1');

      expect(mockCompaniesService.findById).toHaveBeenCalledWith('1');
      expect(result.message).toBe('Company fetched successfully');
      expect(result.data).toEqual(expectedCompany);
    });
  });

  describe('updateById', () => {
    it('should call companiesService.updateById and return success response', async () => {
      const dto: UpdateCompanyDto = {
        name: 'Updated Corp',
      };

      const expectedCompany = {
        id: '1',
        userId: '10',
        name: 'Updated Corp',
        description: 'A tech company',
        logoUrl: null,
        website: 'https://techcorp.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCompaniesService.updateById.mockResolvedValue(expectedCompany);

      const result = await controller.updateById('1', '10', dto);

      expect(mockCompaniesService.updateById).toHaveBeenCalledWith(
        '1',
        '10',
        dto,
      );
      expect(result.message).toBe('Company updated successfully');
      expect(result.data).toEqual(expectedCompany);
    });
  });

  describe('uploadLogo', () => {
    it('should call companiesService.uploadLogo and return success response', async () => {
      const file = {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
        originalname: 'logo.jpg',
        size: 1024,
      } as Express.Multer.File;

      const expectedResult = {
        logoUrl: 'http://minio:9000/job-board-uploads/logos/1_1234567890.jpg',
      };

      mockCompaniesService.uploadLogo.mockResolvedValue(expectedResult);

      const result = await controller.uploadLogo('1', '10', file);

      expect(mockCompaniesService.uploadLogo).toHaveBeenCalledWith(
        '1',
        '10',
        file,
      );
      expect(result.message).toBe('Logo uploaded successfully');
      expect(result.data).toEqual(expectedResult);
    });
  });
});
