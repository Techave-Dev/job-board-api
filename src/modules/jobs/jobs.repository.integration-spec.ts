import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { JobsRepository } from './jobs.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createUser,
  createCompany,
  createJob,
  createAttachment,
} from '../../generated/prisma/sql';

describe('JobsRepository', () => {
  let repository: JobsRepository;
  let module: TestingModule;
  let seedUserId: string;
  let seedCompanyId: string;
  let seedJobId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [JobsRepository],
    }).compile();

    repository = module.get(JobsRepository);
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

    const [company] = await prisma.$queryRawTyped(
      createCompany(
        BigInt(seedUserId),
        'Seed Company',
        'A seed company',
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
  });

  afterAll(async () => {
    const prisma = module.get(PrismaService);
    await prisma.job.deleteMany({
      where: { companyId: BigInt(seedCompanyId) },
    });
    await prisma.company.delete({ where: { id: BigInt(seedCompanyId) } });
    await prisma.user.delete({ where: { id: BigInt(seedUserId) } });
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create and return a job', async () => {
      const job = await repository.create({
        companyId: seedCompanyId,
        title: 'New Job',
        description: 'New description',
        location: 'Bandung',
        salaryMin: 3000000,
        salaryMax: 7000000,
      });

      expect(job.id).toBeDefined();
      expect(job.companyId).toBe(seedCompanyId);
      expect(job.title).toBe('New Job');
      expect(job.description).toBe('New description');
      expect(job.location).toBe('Bandung');
      expect(job.salaryMin).toBe(3000000);
      expect(job.salaryMax).toBe(7000000);
      expect(job.createdAt).toBeInstanceOf(Date);

      const prisma = module.get(PrismaService);
      await prisma.job.delete({ where: { id: BigInt(job.id) } });
    });

    it('should create job with null optional fields', async () => {
      const job = await repository.create({
        companyId: seedCompanyId,
        title: 'Minimal Job',
        description: 'Minimal description',
      });

      expect(job.title).toBe('Minimal Job');
      expect(job.location).toBeNull();
      expect(job.salaryMin).toBeNull();
      expect(job.salaryMax).toBeNull();

      const prisma = module.get(PrismaService);
      await prisma.job.delete({ where: { id: BigInt(job.id) } });
    });
  });

  describe('list', () => {
    it('should return jobs with company info', async () => {
      const jobs = await repository.list({ page: 1, limit: 20 });

      expect(jobs.length).toBeGreaterThanOrEqual(1);
      const found = jobs.find((j) => j.id === seedJobId);
      expect(found).toBeDefined();
      expect(found!.companyName).toBe('Seed Company');
      expect(found!.title).toBe('Seed Job');
      expect(found!.applicationCount).toBe(0);
    });

    it('should filter by search term', async () => {
      const jobs = await repository.list({
        page: 1,
        limit: 20,
        search: 'Seed',
      });

      expect(jobs.length).toBeGreaterThanOrEqual(1);
      expect(jobs.every((j) => j.title.includes('Seed'))).toBe(true);
    });

    it('should return empty for non-matching search', async () => {
      const jobs = await repository.list({
        page: 1,
        limit: 20,
        search: 'zzz_nonexistent_zzz',
      });

      expect(jobs).toEqual([]);
    });

    it('should respect pagination', async () => {
      const jobs = await repository.list({ page: 1, limit: 1 });
      expect(jobs.length).toBeLessThanOrEqual(1);
    });
  });

  describe('count', () => {
    it('should return correct total count', async () => {
      const total = await repository.count({ page: 1, limit: 20 });
      expect(total).toBeGreaterThanOrEqual(1);
    });

    it('should return filtered count', async () => {
      const total = await repository.count({
        page: 1,
        limit: 20,
        search: 'Seed',
      });
      expect(total).toBeGreaterThanOrEqual(1);
    });

    it('should return 0 for non-matching search', async () => {
      const total = await repository.count({
        page: 1,
        limit: 20,
        search: 'zzz_nonexistent_zzz',
      });
      expect(total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return job with company info and applicationCount', async () => {
      const job = await repository.findById(seedJobId);

      expect(job).not.toBeNull();
      expect(job!.id).toBe(seedJobId);
      expect(job!.companyName).toBe('Seed Company');
      expect(job!.title).toBe('Seed Job');
      expect(job!.applicationCount).toBe(0);
    });

    it('should return null for non-existent id', async () => {
      const job = await repository.findById('999999');
      expect(job).toBeNull();
    });
  });

  describe('getCompanyId', () => {
    it('should return company id for a job', async () => {
      const companyId = await repository.getCompanyId(seedJobId);
      expect(companyId).toBe(seedCompanyId);
    });

    it('should return null for non-existent job', async () => {
      const companyId = await repository.getCompanyId('999999');
      expect(companyId).toBeNull();
    });
  });

  describe('updateById', () => {
    it('should update title only (COALESCE keeps other fields)', async () => {
      const updated = await repository.updateById(seedJobId, {
        title: 'Updated Seed Job',
      });

      expect(updated.title).toBe('Updated Seed Job');
      expect(updated.description).toBe('Seed description');
      expect(updated.location).toBe('Jakarta');
    });

    it('should update all fields', async () => {
      const updated = await repository.updateById(seedJobId, {
        title: 'Fully Updated',
        description: 'Fully updated description',
        location: 'Surabaya',
        salaryMin: 8000000,
        salaryMax: 15000000,
      });

      expect(updated.title).toBe('Fully Updated');
      expect(updated.description).toBe('Fully updated description');
      expect(updated.location).toBe('Surabaya');
      expect(updated.salaryMin).toBe(8000000);
      expect(updated.salaryMax).toBe(15000000);
    });

    it('should reset seed data for subsequent tests', async () => {
      await repository.updateById(seedJobId, {
        title: 'Seed Job',
        description: 'Seed description',
        location: 'Jakarta',
        salaryMin: 5000000,
        salaryMax: 10000000,
      });
    });
  });

  describe('deleteById', () => {
    it('should delete job and return true', async () => {
      const prisma = module.get(PrismaService);
      const [job] = await prisma.$queryRawTyped(
        createJob(
          BigInt(seedCompanyId),
          'To Delete',
          'desc',
          null as any,
          null as any,
          null as any,
        ),
      );

      const deleted = await repository.deleteById(job.id.toString());
      expect(deleted).toBe(true);

      const found = await repository.findById(job.id.toString());
      expect(found).toBeNull();
    });

    it('should return false for non-existent job', async () => {
      const deleted = await repository.deleteById('999999');
      expect(deleted).toBe(false);
    });
  });

  describe('createAttachment', () => {
    it('should create and return an attachment', async () => {
      const attachment = await repository.createAttachment({
        jobId: seedJobId,
        filename: 'attachments/1_test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      });

      expect(attachment.id).toBeDefined();
      expect(attachment.jobId).toBe(seedJobId);
      expect(attachment.filename).toBe('attachments/1_test.pdf');
      expect(attachment.originalName).toBe('test.pdf');
      expect(attachment.mimeType).toBe('application/pdf');
      expect(attachment.size).toBe(1024);
      expect(attachment.createdAt).toBeInstanceOf(Date);

      const prisma = module.get(PrismaService);
      await prisma.attachment.delete({ where: { id: BigInt(attachment.id) } });
    });
  });

  describe('listAttachmentsByJobId', () => {
    let attachmentId: string;

    beforeAll(async () => {
      const prisma = module.get(PrismaService);
      const [att] = await prisma.$queryRawTyped(
        createAttachment(
          BigInt(seedJobId),
          'attachments/seed_test.pdf',
          'seed_test.pdf',
          'application/pdf',
          2048,
        ),
      );
      attachmentId = att.id.toString();
    });

    afterAll(async () => {
      const prisma = module.get(PrismaService);
      await prisma.attachment.delete({ where: { id: BigInt(attachmentId) } });
    });

    it('should return attachments sorted by createdAt DESC', async () => {
      const attachments = await repository.listAttachmentsByJobId(seedJobId);

      expect(attachments.length).toBeGreaterThanOrEqual(1);
      const found = attachments.find((a) => a.id === attachmentId);
      expect(found).toBeDefined();
      expect(found!.filename).toBe('attachments/seed_test.pdf');
    });

    it('should return empty array for job with no attachments', async () => {
      const prisma = module.get(PrismaService);
      const [user] = await prisma.$queryRawTyped(
        createUser(
          `no-att-${randomUUID()}@gmail.com`,
          'hashed-password',
          'No Att User',
          'company',
        ),
      );
      const [company] = await prisma.$queryRawTyped(
        createCompany(
          BigInt(user.id.toString()),
          'No Att Company',
          null as any,
          null as any,
        ),
      );
      const [job] = await prisma.$queryRawTyped(
        createJob(
          BigInt(company.id.toString()),
          'No Att Job',
          'desc',
          null as any,
          null as any,
          null as any,
        ),
      );

      const attachments = await repository.listAttachmentsByJobId(
        job.id.toString(),
      );
      expect(attachments).toEqual([]);

      await prisma.job.delete({ where: { id: job.id } });
      await prisma.company.delete({ where: { id: company.id } });
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe('getAttachmentById', () => {
    let attachmentId: string;

    beforeAll(async () => {
      const prisma = module.get(PrismaService);
      const [att] = await prisma.$queryRawTyped(
        createAttachment(
          BigInt(seedJobId),
          'attachments/get_test.pdf',
          'get_test.pdf',
          'application/pdf',
          1024,
        ),
      );
      attachmentId = att.id.toString();
    });

    afterAll(async () => {
      const prisma = module.get(PrismaService);
      await prisma.attachment.delete({ where: { id: BigInt(attachmentId) } });
    });

    it('should return attachment with companyId', async () => {
      const attachment = await repository.getAttachmentById(attachmentId);

      expect(attachment).not.toBeNull();
      expect(attachment!.id).toBe(attachmentId);
      expect(attachment!.companyId).toBe(seedCompanyId);
    });

    it('should return null for non-existent id', async () => {
      const attachment = await repository.getAttachmentById('999999');
      expect(attachment).toBeNull();
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment and return true', async () => {
      const prisma = module.get(PrismaService);
      const [att] = await prisma.$queryRawTyped(
        createAttachment(
          BigInt(seedJobId),
          'attachments/to_delete.pdf',
          'to_delete.pdf',
          'application/pdf',
          512,
        ),
      );

      const deleted = await repository.deleteAttachment(att.id.toString());
      expect(deleted).toBe(true);

      const found = await repository.getAttachmentById(att.id.toString());
      expect(found).toBeNull();
    });

    it('should return false for non-existent attachment', async () => {
      const deleted = await repository.deleteAttachment('999999');
      expect(deleted).toBe(false);
    });
  });

  describe('cascade delete', () => {
    it('should delete attachments when job is deleted', async () => {
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
      const [att] = await prisma.$queryRawTyped(
        createAttachment(
          BigInt(job.id.toString()),
          'attachments/cascade_test.pdf',
          'cascade_test.pdf',
          'application/pdf',
          1024,
        ),
      );

      const found = await repository.getAttachmentById(att.id.toString());
      expect(found).not.toBeNull();

      await prisma.job.delete({ where: { id: job.id } });

      const deleted = await repository.getAttachmentById(att.id.toString());
      expect(deleted).toBeNull();
    });
  });
});
