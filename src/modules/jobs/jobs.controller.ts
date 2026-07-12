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
import { IJobsService } from './interfaces/jobs.service.interface';
import { type CreateJobDto, CreateJobSchema } from './dto/create-job.dto';
import { type UpdateJobDto, UpdateJobSchema } from './dto/update-job.dto';
import {
  type PaginationQueryDto,
  PaginationQuerySchema,
} from './dto/pagination-query.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { ApiResponse } from '../../common/types/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('jobs')
export class JobsController {
  constructor(
    @Inject(IJobsService)
    private readonly jobsService: IJobsService,
  ) {}

  @Post()
  @Roles('company')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(CreateJobSchema)) dto: CreateJobDto,
  ): Promise<ApiResponse> {
    const job = await this.jobsService.create(userId, dto);
    return new ApiResponse('Job created successfully', job);
  }

  @Public()
  @Get()
  async list(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: PaginationQueryDto,
  ): Promise<ApiResponse> {
    const result = await this.jobsService.list(query);
    return new ApiResponse(
      'Jobs fetched successfully',
      result.data,
      result.meta,
    );
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string): Promise<ApiResponse> {
    const job = await this.jobsService.findById(id);
    return new ApiResponse('Job fetched successfully', job);
  }

  @Patch(':id')
  @Roles('company')
  async updateById(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(UpdateJobSchema)) dto: UpdateJobDto,
  ): Promise<ApiResponse> {
    const job = await this.jobsService.updateById(id, userId, dto);
    return new ApiResponse('Job updated successfully', job);
  }

  @Delete(':id')
  @Roles('company')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    await this.jobsService.deleteById(id, userId);
  }

  @Post(':id/attachments')
  @Roles('company')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
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
  ): Promise<ApiResponse> {
    const attachment = await this.jobsService.uploadAttachment(
      id,
      userId,
      file,
    );
    return new ApiResponse('Attachment uploaded successfully', attachment);
  }

  @Delete(':jobId/attachments/:attachmentId')
  @Roles('company')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAttachment(
    @Param('jobId') jobId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    await this.jobsService.deleteAttachment(jobId, attachmentId, userId);
  }
}
