import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesRepository } from './companies.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { createUser } from '../../generated/prisma/sql';

describe('CompaniesRepository', () => {
  let repository: CompaniesRepository;
  let module: TestingModule;
  let seedUserId: string;
  let seedCompanyId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [CompaniesRepository],
    }).compile();

    repository = module.get(CompaniesRepository);

    const prisma = module.get(PrismaService);
    const [user] = await prisma.$queryRawTyped(
      createUser(
        `seed-${randomUUID()}@gmail.com`,
        'hashed-password',
        'Seed User',
        'company',
      ),
    );
    seedUserId = user.id.toString();

    const company = await repository.create({
      userId: seedUserId,
      name: 'Seed Company',
      description: 'A seed company',
      website: 'https://seed.com',
    });
    seedCompanyId = company.id;
  });

  afterAll(async () => {
    const prisma = module.get(PrismaService);
    await prisma.company.deleteMany({ where: { userId: BigInt(seedUserId) } });
    await prisma.user.delete({ where: { id: BigInt(seedUserId) } });
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create and return a company', async () => {
      const prisma = module.get(PrismaService);
      const [user] = await prisma.$queryRawTyped(
        createUser(
          `create-${randomUUID()}@gmail.com`,
          'hashed-password',
          'Create User',
          'company',
        ),
      );

      const company = await repository.create({
        userId: user.id.toString(),
        name: 'New Company',
        description: 'A new company',
        website: 'https://new.com',
      });

      expect(company.id).toBeDefined();
      expect(company.userId).toBe(user.id.toString());
      expect(company.name).toBe('New Company');
      expect(company.description).toBe('A new company');
      expect(company.website).toBe('https://new.com');
      expect(company.logoUrl).toBeNull();
      expect(company.createdAt).toBeInstanceOf(Date);

      await prisma.company.deleteMany({
        where: { userId: user.id },
      });
      await prisma.user.delete({ where: { id: user.id } });
    });

    it('should throw on duplicate userId (unique constraint)', async () => {
      await expect(
        repository.create({
          userId: seedUserId,
          name: 'Duplicate',
        }),
      ).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return company with jobCount', async () => {
      const company = await repository.findById(seedCompanyId);

      expect(company).not.toBeNull();
      expect(company!.id).toBe(seedCompanyId);
      expect(company!.name).toBe('Seed Company');
      expect(company!.jobCount).toBe(0);
    });

    it('should return null for non-existent id', async () => {
      const company = await repository.findById('999999');
      expect(company).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return company by userId', async () => {
      const company = await repository.findByUserId(seedUserId);

      expect(company).not.toBeNull();
      expect(company!.userId).toBe(seedUserId);
      expect(company!.name).toBe('Seed Company');
    });

    it('should return null for non-existent userId', async () => {
      const company = await repository.findByUserId('999999');
      expect(company).toBeNull();
    });
  });

  describe('updateById', () => {
    it('should update name only (COALESCE keeps other fields)', async () => {
      const updated = await repository.updateById(seedCompanyId, {
        name: 'Updated Seed Company',
      });

      expect(updated.name).toBe('Updated Seed Company');
      expect(updated.website).toBe('https://seed.com');
      expect(updated.description).toBe('A seed company');
    });

    it('should update website only', async () => {
      const updated = await repository.updateById(seedCompanyId, {
        website: 'https://updated.com',
      });

      expect(updated.website).toBe('https://updated.com');
      expect(updated.name).toBe('Updated Seed Company');
    });

    it('should reset name back to original for subsequent tests', async () => {
      await repository.updateById(seedCompanyId, {
        name: 'Seed Company',
        website: 'https://seed.com',
      });
    });
  });

  describe('updateLogoUrl', () => {
    it('should update logoUrl', async () => {
      const logoKey = `logos/${seedCompanyId}_${Date.now()}.jpg`;
      const updated = await repository.updateLogoUrl(seedCompanyId, logoKey);

      expect(updated.logoUrl).toBe(logoKey);
      await repository.updateLogoUrl(seedCompanyId, null as any);
    });
  });

  describe('cascade delete', () => {
    it('should delete company when user is deleted', async () => {
      const prisma = module.get(PrismaService);
      const [user] = await prisma.$queryRawTyped(
        createUser(
          `cascade-${randomUUID()}@gmail.com`,
          'hashed-password',
          'Cascade User',
          'company',
        ),
      );

      const company = await repository.create({
        userId: user.id.toString(),
        name: 'Cascade Company',
      });

      const found = await repository.findById(company.id);
      expect(found).not.toBeNull();

      await prisma.user.delete({ where: { id: user.id } });

      const deleted = await repository.findById(company.id);
      expect(deleted).toBeNull();
    });
  });
});
