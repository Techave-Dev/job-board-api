import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ICompaniesService } from './interfaces/companies.service.interface';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ICompaniesRepository } from './interfaces/companies.repository.interface';
import { IStorageService } from '../storage/interfaces/storage.service.interface';

@Injectable()
export class CompaniesService implements ICompaniesService {
  constructor(
    @Inject(ICompaniesRepository)
    private readonly companiesRepository: ICompaniesRepository,
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
  ) {}

  async create(userId: string, dto: CreateCompanyDto) {
    const existing = await this.companiesRepository.findByUserId(userId);
    if (existing) {
      throw new ConflictException({
        code: 'company.already_exists',
        message: 'Company already exists',
      });
    }

    const company = await this.companiesRepository.create({ userId, ...dto });
    return {
      id: company.id,
      userId: company.userId,
      name: company.name,
      description: company.description,
      logoUrl: company.logoUrl,
      website: company.website,
      createdAt: company.createdAt,
    };
  }

  async findById(id: string) {
    const company = await this.companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundException({
        code: 'company.not_found',
        message: 'Company not found',
      });
    }

    return company;
  }

  async updateById(id: string, userId: string, dto: UpdateCompanyDto) {
    const company = await this.companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundException({
        code: 'company.not_found',
        message: 'Company not found',
      });
    }

    if (company.userId !== userId) {
      throw new ForbiddenException({
        code: 'company.forbidden',
        message: 'Forbidden',
      });
    }

    return this.companiesRepository.updateById(id, dto);
  }

  async uploadLogo(
    id: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ logoUrl: string }> {
    const company = await this.companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundException({
        code: 'company.not_found',
        message: 'Company not found',
      });
    }

    if (company.userId !== userId) {
      throw new ForbiddenException({
        code: 'company.forbidden',
        message: 'Forbidden',
      });
    }

    const ext = file.originalname.split('.').pop();
    const key = `logos/${id}_${Date.now()}.${ext}`;

    await this.storageService.upload(key, file.buffer, file.mimetype);
    await this.companiesRepository.updateLogoUrl(id, key);

    const logoUrl = await this.storageService.getPresignedUrl(key);
    return { logoUrl };
  }
}
