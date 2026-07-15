import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

describe('StorageService', () => {
  let service: StorageService;
  let mockSend: jest.Mock;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        MINIO_BUCKET_NAME: 'test-bucket',
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: '9000',
        MINIO_ACCESS_KEY: 'access',
        MINIO_SECRET_KEY: 'secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    mockSend = jest.fn().mockResolvedValue({});
    jest.spyOn(S3Client.prototype, 'send').mockImplementation(mockSend);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should not create bucket if it already exists', async () => {
      await service.onModuleInit();

      expect(mockSend).toHaveBeenCalledWith(expect.any(HeadBucketCommand));
      expect(mockSend).not.toHaveBeenCalledWith(
        expect.any(CreateBucketCommand),
      );
    });

    it('should create bucket if it does not exist', async () => {
      mockSend.mockRejectedValueOnce(new Error('NoSuchBucket'));

      await service.onModuleInit();

      expect(mockSend).toHaveBeenCalledWith(expect.any(HeadBucketCommand));
      expect(mockSend).toHaveBeenCalledWith(expect.any(CreateBucketCommand));
    });
  });

  describe('upload', () => {
    it('should call S3Client.send with PutObjectCommand', async () => {
      const key = 'logos/1_123.jpg';
      const body = Buffer.from('fake-image');
      const mimeType = 'image/jpeg';

      await service.upload(key, body, mimeType);

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });
  });

  describe('getPresignedUrl', () => {
    it('should return presigned URL string', async () => {
      const key = 'logos/1_123.jpg';

      const result = await service.getPresignedUrl(key);

      expect(typeof result).toBe('string');
      expect(result).toContain(key);
    });
  });
});
