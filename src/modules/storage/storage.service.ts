import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PRESIGNED_URL_EXPIRY_SECONDS = 60 * 60;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket =
      this.configService.get<string>('MINIO_BUCKET_NAME') ??
      'job-board-uploads';

    this.client = new S3Client({
      endpoint: `http://${this.configService.get<string>('MINIO_ENDPOINT')}:${this.configService.get<string>('MINIO_PORT')}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get<string>('MINIO_ACCESS_KEY') ?? '',
        secretAccessKey:
          this.configService.get<string>('MINIO_SECRET_KEY') ?? '',
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(
        `Bucket "${this.bucket}" already exists, skipping creation`,
      );
    } catch (err) {
      if (err instanceof Error) {
        const errorName = 'name' in err ? err.name : '';
        const httpStatus =
          err && typeof err === 'object' && '$metadata' in err
            ? (err as { $metadata: { httpStatusCode?: number } }).$metadata
                .httpStatusCode
            : undefined;

        if (
          errorName === 'NoSuchBucket' ||
          err.message === 'NoSuchBucket' ||
          errorName === 'NotFound' ||
          httpStatus === 404
        ) {
          try {
            await this.client.send(
              new CreateBucketCommand({ Bucket: this.bucket }),
            );
            this.logger.log(`Bucket "${this.bucket}" created successfully`);
          } catch (createErr) {
            if (createErr instanceof Error) {
              const createErrName = 'name' in createErr ? createErr.name : '';

              if (
                createErrName === 'BucketAlreadyOwnedByYou' ||
                createErrName === 'BucketAlreadyExists'
              ) {
                this.logger.log(
                  `Bucket "${this.bucket}" was created concurrently by another process, skipping`,
                );
                return;
              }
            }
            throw createErr;
          }
          return;
        }
      }

      throw err;
    }
  }

  async upload(key: string, body: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
      }),
    );
  }

  async getPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
    });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
