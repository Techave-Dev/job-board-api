import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { FilesController } from './files.controller';
import { IFilesService } from './interfaces/files.service.interface';

describe('FilesController', () => {
  let controller: FilesController;
  const mockFilesService = mock<IFilesService>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        { provide: IFilesService, useValue: mockFilesService },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    jest.clearAllMocks();
  });

  describe('getFile', () => {
    it('should return presigned URL for logos', async () => {
      mockFilesService.getPresignedUrl.mockResolvedValue({
        url: 'https://minio.example.com/logos/1_123.jpg',
      });

      const result = await controller.getFile('logos', '1');

      expect(result.message).toBe('File fetched successfully');
      expect(result.data).toEqual({
        url: 'https://minio.example.com/logos/1_123.jpg',
      });
      expect(mockFilesService.getPresignedUrl).toHaveBeenCalledWith(
        'logos',
        '1',
        undefined,
        undefined,
      );
    });

    it('should pass userId and userRole to service', async () => {
      mockFilesService.getPresignedUrl.mockResolvedValue({
        url: 'https://minio.example.com/resumes/200_123.pdf',
      });

      const result = await controller.getFile(
        'resumes',
        '1',
        '200',
        'applicant',
      );

      expect(result.message).toBe('File fetched successfully');
      expect(mockFilesService.getPresignedUrl).toHaveBeenCalledWith(
        'resumes',
        '1',
        '200',
        'applicant',
      );
    });

    it('should handle attachments type', async () => {
      mockFilesService.getPresignedUrl.mockResolvedValue({
        url: 'https://minio.example.com/attachments/10_123.pdf',
      });

      const result = await controller.getFile('attachments', '1', '100');

      expect(result.message).toBe('File fetched successfully');
      expect(mockFilesService.getPresignedUrl).toHaveBeenCalledWith(
        'attachments',
        '1',
        '100',
        undefined,
      );
    });
  });
});
