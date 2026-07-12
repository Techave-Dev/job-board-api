export interface Company {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyWithJobCount extends Company {
  jobCount: number;
}

export type CreatedCompany = Omit<Company, 'updatedAt'>;

export interface CreateCompanyInput {
  userId: string;
  name: string;
  description?: string;
  website?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  website?: string;
}

export const ICompaniesRepository = Symbol('ICompaniesRepository');

export interface ICompaniesRepository {
  create(data: CreateCompanyInput): Promise<CreatedCompany>;
  findById(id: string): Promise<CompanyWithJobCount | null>;
  findByUserId(userId: string): Promise<Company | null>;
  updateById(id: string, data: UpdateCompanyInput): Promise<Company>;
  updateLogoUrl(id: string, logoUrl: string): Promise<Company>;
}
