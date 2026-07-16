import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { IApplicationsService } from './interfaces/applications.service.interface';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import {
  listApplicationsQuerySchema,
  type ListApplicationsQueryDto,
} from './dto/list-applications-query.dto';
import {
  updateApplicationStatusSchema,
  type UpdateApplicationStatusDto,
} from './dto/update-application-status.dto';
import { ApiResponse as ApiRes } from '../../common/types/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Applications')
@Controller()
export class ApplicationsController {
  constructor(
    @Inject(IApplicationsService)
    private readonly applicationsService: IApplicationsService,
  ) {}

  @Post('jobs/:jobId/applications')
  @Roles('applicant')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'jobId', description: 'Job ID to apply for' })
  @ApiOperation({ summary: 'Apply to a job with resume (PDF only, max 5 MB)' })
  @ApiResponse({
    status: 201,
    description: 'Application submitted successfully',
    content: {
      'application/json': {
        example: {
          message: 'Application submitted successfully',
          data: {
            id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
            jobId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
            applicantId: '550e8400-e29b-41d4-a716-446655440000',
            resumeUrl: 'https://minio.example.com/resumes/...',
            status: 'pending',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Already applied to this job',
    content: {
      'application/json': {
        example: {
          statusCode: 409,
          error: 'Conflict',
          message: ['You have already applied to this job'],
        },
      },
    },
  })
  async apply(
    @Param('jobId') jobId: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile(
      new FileValidationPipe({
        maxSizeBytes: 5 * 1024 * 1024,
        allowedMimeTypes: ['application/pdf'],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ApiRes> {
    const application = await this.applicationsService.apply(
      userId,
      jobId,
      file,
    );
    return new ApiRes('Application submitted successfully', application);
  }

  @Get('applications')
  @Roles('applicant')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my applications' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
  })
  @ApiResponse({
    status: 200,
    description: 'Applications fetched successfully',
    content: {
      'application/json': {
        example: {
          message: 'Applications fetched successfully',
          data: [
            {
              id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
              jobId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
              applicantId: '550e8400-e29b-41d4-a716-446655440000',
              resumeUrl: 'https://minio.example.com/resumes/...',
              status: 'pending',
              job: {
                title: 'Backend Engineer',
                company: { name: 'Acme Corp' },
              },
              createdAt: '2025-01-01T00:00:00.000Z',
            },
          ],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    },
  })
  async listMine(
    @CurrentUser('userId') userId: string,
    @Query(new ZodValidationPipe(listApplicationsQuerySchema))
    query: ListApplicationsQueryDto,
  ): Promise<ApiRes> {
    const result = await this.applicationsService.listMine(userId, query);
    return new ApiRes(
      'Applications fetched successfully',
      result.data,
      result.meta,
    );
  }

  @Get('jobs/:jobId/applications')
  @Roles('company')
  @ApiBearerAuth()
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiOperation({ summary: 'List applications for a job (company owner only)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
  })
  @ApiResponse({
    status: 200,
    description: 'Applications fetched successfully',
    content: {
      'application/json': {
        example: {
          message: 'Applications fetched successfully',
          data: [
            {
              id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
              jobId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
              applicantId: '550e8400-e29b-41d4-a716-446655440000',
              resumeUrl: 'https://minio.example.com/resumes/...',
              status: 'pending',
              createdAt: '2025-01-01T00:00:00.000Z',
            },
          ],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      },
    },
  })
  async listForJob(
    @Param('jobId') jobId: string,
    @CurrentUser('userId') userId: string,
    @Query(new ZodValidationPipe(listApplicationsQuerySchema))
    query: ListApplicationsQueryDto,
  ): Promise<ApiRes> {
    const result = await this.applicationsService.listForJob(
      jobId,
      userId,
      query,
    );
    return new ApiRes(
      'Applications fetched successfully',
      result.data,
      result.meta,
    );
  }

  @Patch('applications/:id/status')
  @Roles('company')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiOperation({
    summary: 'Update application status (reviewed/accepted/rejected)',
  })
  @ApiResponse({
    status: 200,
    description: 'Application status updated successfully',
    content: {
      'application/json': {
        example: {
          message: 'Application status updated successfully',
          data: {
            id: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
            jobId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
            applicantId: '550e8400-e29b-41d4-a716-446655440000',
            resumeUrl: 'https://minio.example.com/resumes/...',
            status: 'accepted',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Not job owner or invalid status transition',
    content: {
      'application/json': {
        example: {
          statusCode: 403,
          error: 'Forbidden',
          message: ['You can only update applications for your own jobs'],
        },
      },
    },
  })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(updateApplicationStatusSchema))
    dto: UpdateApplicationStatusDto,
  ): Promise<ApiRes> {
    const updated = await this.applicationsService.updateStatus(
      id,
      userId,
      dto.status,
    );
    return new ApiRes('Application status updated successfully', updated);
  }
}
