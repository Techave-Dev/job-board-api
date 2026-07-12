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
import { ApiResponse } from '../../common/types/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller()
export class ApplicationsController {
  constructor(
    @Inject(IApplicationsService)
    private readonly applicationsService: IApplicationsService,
  ) {}

  @Post('jobs/:jobId/applications')
  @Roles('applicant')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
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
  ): Promise<ApiResponse> {
    const application = await this.applicationsService.apply(
      userId,
      jobId,
      file,
    );
    return new ApiResponse('Application submitted successfully', application);
  }

  @Get('applications')
  @Roles('applicant')
  async listMine(
    @CurrentUser('userId') userId: string,
    @Query(new ZodValidationPipe(listApplicationsQuerySchema))
    query: ListApplicationsQueryDto,
  ): Promise<ApiResponse> {
    const result = await this.applicationsService.listMine(userId, query);
    return new ApiResponse(
      'Applications fetched successfully',
      result.data,
      result.meta,
    );
  }

  @Get('jobs/:jobId/applications')
  @Roles('company')
  async listForJob(
    @Param('jobId') jobId: string,
    @CurrentUser('userId') userId: string,
    @Query(new ZodValidationPipe(listApplicationsQuerySchema))
    query: ListApplicationsQueryDto,
  ): Promise<ApiResponse> {
    const result = await this.applicationsService.listForJob(
      jobId,
      userId,
      query,
    );
    return new ApiResponse(
      'Applications fetched successfully',
      result.data,
      result.meta,
    );
  }

  @Patch('applications/:id/status')
  @Roles('company')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(updateApplicationStatusSchema))
    dto: UpdateApplicationStatusDto,
  ): Promise<ApiResponse> {
    const updated = await this.applicationsService.updateStatus(
      id,
      userId,
      dto.status,
    );
    return new ApiResponse('Application status updated successfully', updated);
  }
}
