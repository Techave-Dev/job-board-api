import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Inject,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ICompaniesService } from './interfaces/companies.service.interface';
import {
  type CreateCompanyDto,
  CreateCompanySchema,
} from './dto/create-company.dto';
import {
  type UpdateCompanyDto,
  UpdateCompanySchema,
} from './dto/update-company.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { FileValidationPipe } from '../../common/pipes/file-validation.pipe';
import { ApiResponse } from '../../common/types/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(
    @Inject(ICompaniesService)
    private readonly companiesService: ICompaniesService,
  ) {}

  @Post()
  @Roles('applicant')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(CreateCompanySchema)) dto: CreateCompanyDto,
  ): Promise<ApiResponse> {
    const company = await this.companiesService.create(userId, dto);
    return new ApiResponse('Company created successfully', company);
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string): Promise<ApiResponse> {
    const company = await this.companiesService.findById(id);
    return new ApiResponse('Company fetched successfully', company);
  }

  @Patch(':id')
  async updateById(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(UpdateCompanySchema)) dto: UpdateCompanyDto,
  ): Promise<ApiResponse> {
    const company = await this.companiesService.updateById(id, userId, dto);
    return new ApiResponse('Company updated successfully', company);
  }

  @Post(':id/logo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile(
      new FileValidationPipe({
        maxSizeBytes: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ApiResponse> {
    const result = await this.companiesService.uploadLogo(id, userId, file);
    return new ApiResponse('Logo uploaded successfully', result);
  }
}
