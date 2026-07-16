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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
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
import { ApiResponse as ApiRes } from '../../common/types/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(
    @Inject(ICompaniesService)
    private readonly companiesService: ICompaniesService,
  ) {}

  @Post()
  @Roles('applicant')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a company profile (applicant only)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Acme Corp' },
        description: { type: 'string', example: 'A great tech company' },
        website: { type: 'string', example: 'https://acme.com' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
    content: {
      'application/json': {
        example: {
          message: 'Company created successfully',
          data: {
            id: 'c0a80001-0000-0000-0000-000000000001',
            name: 'Acme Corp',
            description: 'A great tech company',
            website: 'https://acme.com',
            logoUrl: null,
            ownerId: '550e8400-e29b-41d4-a716-446655440000',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — only applicant role can create company',
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
    @Body(new ZodValidationPipe(CreateCompanySchema)) dto: CreateCompanyDto,
  ): Promise<ApiRes> {
    const company = await this.companiesService.create(userId, dto);
    return new ApiRes('Company created successfully', company);
  }

  @Public()
  @Get(':id')
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiOperation({ summary: 'Get a company by ID' })
  @ApiResponse({
    status: 200,
    description: 'Company fetched successfully',
    content: {
      'application/json': {
        example: {
          message: 'Company fetched successfully',
          data: {
            id: 'c0a80001-0000-0000-0000-000000000001',
            name: 'Acme Corp',
            description: 'A great tech company',
            website: 'https://acme.com',
            logoUrl: 'https://minio.example.com/logos/acme.png',
            ownerId: '550e8400-e29b-41d4-a716-446655440000',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
    content: {
      'application/json': {
        example: {
          statusCode: 404,
          error: 'Not Found',
          message: ['Company not found'],
        },
      },
    },
  })
  async findById(@Param('id') id: string): Promise<ApiRes> {
    const company = await this.companiesService.findById(id);
    return new ApiRes('Company fetched successfully', company);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiOperation({ summary: 'Update a company' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Acme Corp Updated' },
        description: { type: 'string', example: 'An even better company' },
        website: { type: 'string', example: 'https://acme-updated.com' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully',
    content: {
      'application/json': {
        example: {
          message: 'Company updated successfully',
          data: {
            id: 'c0a80001-0000-0000-0000-000000000001',
            name: 'Acme Corp Updated',
            description: 'An even better company',
            website: 'https://acme-updated.com',
            logoUrl: 'https://minio.example.com/logos/acme.png',
            ownerId: '550e8400-e29b-41d4-a716-446655440000',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Not company owner',
    content: {
      'application/json': {
        example: {
          statusCode: 403,
          error: 'Forbidden',
          message: ['You can only update your own company'],
        },
      },
    },
  })
  async updateById(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body(new ZodValidationPipe(UpdateCompanySchema)) dto: UpdateCompanyDto,
  ): Promise<ApiRes> {
    const company = await this.companiesService.updateById(id, userId, dto);
    return new ApiRes('Company updated successfully', company);
  }

  @Post(':id/logo')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiOperation({ summary: 'Upload company logo (JPEG/PNG/WebP, max 5 MB)' })
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
    status: 200,
    description: 'Logo uploaded successfully',
    content: {
      'application/json': {
        example: {
          message: 'Logo uploaded successfully',
          data: {
            logoUrl:
              'https://minio.example.com/logos/550e8400-e29b-41d4-a716-446655440000.png',
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
          message: ['File too large. Maximum size is 5 MB'],
        },
      },
    },
  })
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
  ): Promise<ApiRes> {
    const result = await this.companiesService.uploadLogo(id, userId, file);
    return new ApiRes('Logo uploaded successfully', result);
  }
}
