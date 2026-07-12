import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import {
  Company,
  CompanyWithJobCount,
  CreatedCompany,
} from './companies.repository.interface';

export interface UploadLogoResult {
  logoUrl: string;
}

export const ICompaniesService = Symbol('ICompaniesService');

export interface ICompaniesService {
  create(userId: string, dto: CreateCompanyDto): Promise<CreatedCompany>;
  findById(id: string): Promise<CompanyWithJobCount | null>;
  updateById(
    id: string,
    userId: string,
    dto: UpdateCompanyDto,
  ): Promise<Company>;
  uploadLogo(
    id: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<UploadLogoResult>;
}
