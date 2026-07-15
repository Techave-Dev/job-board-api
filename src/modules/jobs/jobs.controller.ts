import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { IJobsService } from './interfaces/jobs.service.interface';
import { type CreateJobDto, CreateJobSchema } from './dto/create-job.dto';
import { type UpdateJobDto, UpdateJobSchema } from './dto/update-job.dto';
import {
  type PaginationQueryDto,
  PaginationQuerySchema,
} from './dto/pagination-query.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { ApiResponse as ApiRes } from '../../common/types/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    @Inject(IJobsService)
    private readonly jobsService: IJobsService,
  ) {}

  @Post()
  @Roles('company')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a job (company only)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'description'],
      properties: {
        title: { type: 'string', example: 'Backend Engineer' },
        description: { type: 'string', example: 'Build scalable APIs' },
        location: { type: 'string', example: 'Jakarta' },
        salaryMin: { type: 'number', example: 5000000 },
        salaryMax: { type: 'number', example: 10000000 },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Job created successfully',
    content: {
      'application/json': {
        example: {
          message: 'Job created successfully',
          data: {
            id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
            companyId: 'c0a80001-0000-0000-0000-000000000001',
            title: 'Backend Engineer',
            description: 'Build scalable APIs',
            location: 'Jakarta',
            salaryMin: 5000000,
            salaryMax: 10000000,
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — only company role can create jobs',
    content: {
      'application/json': {
        example: {
          statusCode: 403,
          error: 'Forbidden',
          message: ['Forbidden resource'],
        },
      },
    },
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(CreateJobSchema)) dto: CreateJobDto,
  ): Promise<ApiRes> {
    const job = await this.jobsService.create(userId, dto);
    return new ApiRes('Job created successfully', job);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List jobs with pagination & filters' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default 20)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term (title contains)',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by location',
  })
  @ApiQuery({
    name: 'salaryMin',
    required: false,
    description: 'Minimum salary filter',
  })
  @ApiQuery({
    name: 'salaryMax',
    required: false,
    description: 'Maximum salary filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Jobs fetched successfully',
    content: {
      'application/json': {
        example: {
          message: 'Jobs fetched successfully',
          data: [
            {
              id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
              title: 'Backend Engineer',
              description: 'Build scalable APIs',
              location: 'Jakarta',
              salaryMin: 5000000,
              salaryMax: 10000000,
              companyId: 'c0a80001-0000-0000-0000-000000000001',
              company: {
                id: 'c0a80001-0000-0000-0000-000000000001',
                name: 'Acme Corp',
              },
              createdAt: '2025-01-01T00:00:00.000Z',
            },
          ],
          meta: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
      },
    },
  })
  async list(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: PaginationQueryDto,
  ): Promise<ApiRes> {
    const result = await this.jobsService.list(query);
    return new ApiRes('Jobs fetched successfully', result.data, result.meta);
  }

  @Public()
  @Get(':id')
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiOperation({ summary: 'Get a job by ID' })
  @ApiResponse({
    status: 200,
    description: 'Job fetched successfully',
    content: {
      'application/json': {
        example: {
          message: 'Job fetched successfully',
          data: {
            id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
            title: 'Backend Engineer',
            description: 'Build scalable APIs',
            location: 'Jakarta',
            salaryMin: 5000000,
            salaryMax: 10000000,
            companyId: 'c0a80001-0000-0000-0000-000000000001',
            company: {
              id: 'c0a80001-0000-0000-0000-000000000001',
              name: 'Acme Corp',
            },
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Job not found',
    content: {
      'application/json': {
        example: {
          statusCode: 404,
          error: 'Not Found',
          message: ['Job not found'],
        },
      },
    },
  })
  async findById(@Param('id') id: string): Promise<ApiRes> {
    const job = await this.jobsService.findById(id);
    return new ApiRes('Job fetched successfully', job);
  }

  @Patch(':id')
  @Roles('company')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiOperation({ summary: 'Update a job (owner only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Senior Backend Engineer' },
        description: {
          type: 'string',
          example: 'Build and scale microservices',
        },
        location: { type: 'string', example: 'Bandung' },
        salaryMin: { type: 'number', example: 7000000 },
        salaryMax: { type: 'number', example: 15000000 },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Job updated successfully',
    content: {
      'application/json': {
        example: {
          message: 'Job updated successfully',
          data: {
            id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
            title: 'Senior Backend Engineer',
            description: 'Build and scale microservices',
            location: 'Bandung',
            salaryMin: 7000000,
            salaryMax: 15000000,
            companyId: 'c0a80001-0000-0000-0000-000000000001',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Not job owner',
    content: {
      'application/json': {
        example: {
          statusCode: 403,
          error: 'Forbidden',
          message: ['You can only update your own jobs'],
        },
      },
    },
  })
  async updateById(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(UpdateJobSchema)) dto: UpdateJobDto,
  ): Promise<ApiRes> {
    const job = await this.jobsService.updateById(id, userId, dto);
    return new ApiRes('Job updated successfully', job);
  }

  @Delete(':id')
  @Roles('company')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiOperation({ summary: 'Delete a job (owner only)' })
  @ApiResponse({ status: 204, description: 'Job deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Not job owner',
  })
  async deleteById(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    await this.jobsService.deleteById(id, userId);
  }

  @Post(':id/attachments')
  @Roles('company')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiOperation({
    summary: 'Upload job attachment (PDF/JPEG/PNG/WebP, max 10 MB)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Attachment uploaded successfully',
    content: {
      'application/json': {
        example: {
          message: 'Attachment uploaded successfully',
          data: {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            jobId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
            fileName: 'job-description.pdf',
            url: 'https://minio.example.com/attachments/...',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or size',
    content: {
      'application/json': {
        example: {
          statusCode: 400,
          error: 'Bad Request',
          message: ['File too large. Maximum size is 10 MB'],
        },
      },
    },
  })
  async uploadAttachment(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile(
      new FileValidationPipe({
        maxSizeBytes: 10 * 1024 * 1024,
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ApiRes> {
    const attachment = await this.jobsService.uploadAttachment(
      id,
      userId,
      file,
    );
    return new ApiRes('Attachment uploaded successfully', attachment);
  }

  @Delete(':jobId/attachments/:attachmentId')
  @Roles('company')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiParam({ name: 'attachmentId', description: 'Attachment ID' })
  @ApiOperation({ summary: 'Delete a job attachment (owner only)' })
  @ApiResponse({ status: 204, description: 'Attachment deleted successfully' })
  async deleteAttachment(
    @Param('jobId') jobId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    await this.jobsService.deleteAttachment(jobId, attachmentId, userId);
  }
}
