import { Controller, Get, Param, Inject, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IFilesService, FileType } from './interfaces/files.service.interface';
import { ApiResponse as ApiRes } from '../../common/types/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(
    @Inject(IFilesService)
    private readonly filesService: IFilesService,
  ) {}

  @Get(':type/:id')
  @ApiParam({
    name: 'type',
    description: 'File type',
    enum: ['resumes', 'logos', 'attachments'],
  })
  @ApiParam({ name: 'id', description: 'File ID' })
  @ApiOperation({ summary: 'Get a presigned URL to access a file' })
  @ApiResponse({
    status: 200,
    description: 'File URL fetched successfully',
    content: {
      'application/json': {
        example: {
          message: 'File fetched successfully',
          data: {
            url: 'https://minio.example.com/bucket/path?X-Amz-...',
            expiresIn: 3600,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this file',
    content: {
      'application/json': {
        example: {
          statusCode: 403,
          error: 'Forbidden',
          message: ['Access denied'],
        },
      },
    },
  })
  async getFile(
    @Param('type') type: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId?: string,
    @CurrentUser('role') userRole?: string,
  ): Promise<ApiRes> {
    if (type !== 'logos' && !userId) {
      throw new ForbiddenException({
        code: 'file.forbidden',
        message: 'Forbidden',
      });
    }

    const result = await this.filesService.getPresignedUrl(
      type as FileType,
      id,
      userId,
      userRole,
    );
    return new ApiRes('File fetched successfully', result);
  }
}
