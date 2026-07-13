import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ICompaniesService } from './interfaces/companies.service.interface';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import {
  ICompaniesRepository,
  CompanyWithJobCount,
} from './interfaces/companies.repository.interface';
import { IStorageService } from '../storage/interfaces/storage.service.interface';
import { ICacheService } from '../cache/interfaces/cache.service.interface';

@Injectable()
export class CompaniesService implements ICompaniesService {
  private readonly logger = new Logger('CompaniesService');

  constructor(
    @Inject(ICompaniesRepository)
    private readonly companiesRepository: ICompaniesRepository,
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
    @Inject(ICacheService)
    private readonly cacheService: ICacheService,
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

    this.logger.log({
      message: 'Company created',
      companyId: company.id,
      userId,
    });

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
    const cacheKey = `companies:detail:${id}`;
    const cached = await this.cacheService.get<CompanyWithJobCount>(cacheKey);
    if (cached) return cached;

    const company = await this.companiesRepository.findById(id);
    if (!company) {
      throw new NotFoundException({
        code: 'company.not_found',
        message: 'Company not found',
      });
    }

    await this.cacheService.set(cacheKey, company, 900);

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

    const result = await this.companiesRepository.updateById(id, dto);

    await this.cacheService.del(`companies:detail:${id}`);

    return result;
  }

  async findByUserId(userId: string) {
    return this.companiesRepository.findByUserId(userId);
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

    await this.cacheService.del(`companies:detail:${id}`);

    this.logger.log({ message: 'Company logo uploaded', companyId: id });

    const logoUrl = await this.storageService.getPresignedUrl(key);
    return { logoUrl };
  }
}
