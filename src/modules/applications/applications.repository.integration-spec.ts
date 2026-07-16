import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsRepository } from './applications.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createUser,
  createCompany,
  createJob,
} from '../../generated/prisma/sql';

describe('ApplicationsRepository', () => {
  let repository: ApplicationsRepository;
  let module: TestingModule;

  let companyOwnerId: string;
  let seedCompanyId: string;
  let seedJobId: string;
  let applicantId: string;
  let seedApplicationId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [ApplicationsRepository],
    }).compile();

    repository = module.get(ApplicationsRepository);
    const prisma = module.get(PrismaService);

    const [owner] = await prisma.$queryRawTyped(
      createUser(
        `owner-${randomUUID()}@gmail.com`,
        'hashed-password',
        'Company Owner',
        'company',
      ),
    );
    companyOwnerId = owner.id.toString();

    const [company] = await prisma.$queryRawTyped(
      createCompany(
        BigInt(companyOwnerId),
        'Seed Company',
        'desc',
        'https://seed.com',
      ),
    );
    seedCompanyId = company.id.toString();

    const [job] = await prisma.$queryRawTyped(
      createJob(
        BigInt(seedCompanyId),
        'Seed Job',
        'Seed description',
        'Jakarta',
        5000000,
        10000000,
      ),
    );
    seedJobId = job.id.toString();

    const [applicant] = await prisma.$queryRawTyped(
      createUser(
        `applicant-${randomUUID()}@gmail.com`,
        'hashed-password',
        'Applicant One',
        'applicant',
      ),
    );
    applicantId = applicant.id.toString();

    const application = await repository.create({
      jobId: seedJobId,
      userId: applicantId,
      resumeUrl: 'resumes/seed_test.pdf',
    });
    seedApplicationId = application.id;
  });

  afterAll(async () => {
    const prisma = module.get(PrismaService);
    await prisma.application.deleteMany({
      where: { jobId: BigInt(seedJobId) },
    });
    await prisma.job.deleteMany({
      where: { companyId: BigInt(seedCompanyId) },
    });
    await prisma.company.delete({ where: { id: BigInt(seedCompanyId) } });
    await prisma.user.delete({ where: { id: BigInt(companyOwnerId) } });
    await prisma.user.delete({ where: { id: BigInt(applicantId) } });
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create and return an application', async () => {
      const prisma = module.get(PrismaService);
      const [newApplicant] = await prisma.$queryRawTyped(
        createUser(
          `create-${randomUUID()}@gmail.com`,
          'hashed-password',
          'Create Applicant',
          'applicant',
        ),
      );

      const application = await repository.create({
        jobId: seedJobId,
        userId: newApplicant.id.toString(),
        resumeUrl: 'resumes/new_test.pdf',
      });

      expect(application.id).toBeDefined();
      expect(application.jobId).toBe(seedJobId);
      expect(application.userId).toBe(newApplicant.id.toString());
      expect(application.status).toBe('pending');
      expect(application.resumeUrl).toBe('resumes/new_test.pdf');
      expect(application.createdAt).toBeInstanceOf(Date);

      await prisma.application.delete({
        where: { id: BigInt(application.id) },
      });
      await prisma.user.delete({ where: { id: newApplicant.id } });
    });

    it('should throw on duplicate jobId + userId (unique constraint)', async () => {
      await expect(
        repository.create({
          jobId: seedJobId,
          userId: applicantId,
          resumeUrl: 'resumes/duplicate.pdf',
        }),
      ).rejects.toThrow();
    });
  });

  describe('getJobCompanyId', () => {
    it('should return companyId for a job', async () => {
      const companyId = await repository.getJobCompanyId(seedJobId);
      expect(companyId).toBe(seedCompanyId);
    });

    it('should return null for non-existent job', async () => {
      const companyId = await repository.getJobCompanyId('999999');
      expect(companyId).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return application by id', async () => {
      const application = await repository.findById(seedApplicationId);

      expect(application).not.toBeNull();
      expect(application!.id).toBe(seedApplicationId);
      expect(application!.jobId).toBe(seedJobId);
      expect(application!.userId).toBe(applicantId);
      expect(application!.status).toBe('pending');
    });

    it('should return null for non-existent id', async () => {
      const application = await repository.findById('999999');
      expect(application).toBeNull();
    });
  });

  describe('listByUserId', () => {
    it('should return applications with jobTitle and companyName', async () => {
      const rows = await repository.listByUserId(applicantId, {
        page: 1,
        limit: 20,
      });

      expect(rows.length).toBeGreaterThanOrEqual(1);
      const found = rows.find((r) => r.id === seedApplicationId);
      expect(found).toBeDefined();
      expect(found!.jobTitle).toBe('Seed Job');
      expect(found!.companyName).toBe('Seed Company');
      expect(found!.companyId).toBe(seedCompanyId);
    });

    it('should filter by status', async () => {
      const rows = await repository.listByUserId(applicantId, {
        page: 1,
        limit: 20,
        status: 'accepted',
      });

      expect(rows.find((r) => r.id === seedApplicationId)).toBeUndefined();
    });

    it('should respect pagination', async () => {
      const rows = await repository.listByUserId(applicantId, {
        page: 1,
        limit: 0,
      });

      expect(rows).toEqual([]);
    });
  });

  describe('countByUserId', () => {
    it('should return correct total count', async () => {
      const total = await repository.countByUserId(applicantId, {
        page: 1,
        limit: 20,
      });
      expect(total).toBeGreaterThanOrEqual(1);
    });

    it('should return 0 when filtered by non-matching status', async () => {
      const total = await repository.countByUserId(applicantId, {
        page: 1,
        limit: 20,
        status: 'rejected',
      });
      expect(total).toBe(0);
    });
  });

  describe('listByJobId', () => {
    it('should return applications with userName and userEmail', async () => {
      const rows = await repository.listByJobId(seedJobId, {
        page: 1,
        limit: 20,
      });

      expect(rows.length).toBeGreaterThanOrEqual(1);
      const found = rows.find((r) => r.id === seedApplicationId);
      expect(found).toBeDefined();
      expect(found!.userName).toBe('Applicant One');
      expect(found!.userEmail).toContain('applicant-');
    });
  });

  describe('countByJobId', () => {
    it('should return correct total count', async () => {
      const total = await repository.countByJobId(seedJobId, {
        page: 1,
        limit: 20,
      });
      expect(total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateStatus', () => {
    it('should update status and return updated application', async () => {
      const updated = await repository.updateStatus(
        seedApplicationId,
        'reviewed',
      );

      expect(updated.status).toBe('reviewed');
      expect(updated.id).toBe(seedApplicationId);
    });

    it('should reset status back to pending for subsequent tests', async () => {
      const reset = await repository.updateStatus(seedApplicationId, 'pending');
      expect(reset.status).toBe('pending');
    });
  });

  describe('cascade delete', () => {
    it('should delete application when job is deleted', async () => {
      const prisma = module.get(PrismaService);
      const [job] = await prisma.$queryRawTyped(
        createJob(
          BigInt(seedCompanyId),
          'Cascade Job',
          'desc',
          null as any,
          null as any,
          null as any,
        ),
      );

      const application = await repository.create({
        jobId: job.id.toString(),
        userId: applicantId,
        resumeUrl: 'resumes/cascade_test.pdf',
      });

      const found = await repository.findById(application.id);
      expect(found).not.toBeNull();

      await prisma.job.delete({ where: { id: job.id } });

      const deleted = await repository.findById(application.id);
      expect(deleted).toBeNull();
    });

    it('should delete application when applicant user is deleted', async () => {
      const prisma = module.get(PrismaService);
      const [newApplicant] = await prisma.$queryRawTyped(
        createUser(
          `cascade-${randomUUID()}@gmail.com`,
          'hashed-password',
          'Cascade Applicant',
          'applicant',
        ),
      );

      const application = await repository.create({
        jobId: seedJobId,
        userId: newApplicant.id.toString(),
        resumeUrl: 'resumes/cascade_user_test.pdf',
      });

      const found = await repository.findById(application.id);
      expect(found).not.toBeNull();

      await prisma.user.delete({ where: { id: newApplicant.id } });

      const deleted = await repository.findById(application.id);
      expect(deleted).toBeNull();
    });
  });
});
