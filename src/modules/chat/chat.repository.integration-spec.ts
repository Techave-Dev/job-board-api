import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatRepository } from './chat.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createUser,
  createCompany,
  createJob,
} from '../../generated/prisma/sql';
import { createApplication } from '../../generated/prisma/sql';

describe('ChatRepository (Integration Test)', () => {
  let repository: ChatRepository;
  let module: TestingModule;
  let prisma: PrismaService;

  let companyOwnerId: string;
  let seedCompanyId: string;
  let seedJobId: string;
  let applicantId: string;
  let seedApplicationId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [ChatRepository],
    }).compile();

    repository = module.get(ChatRepository);
    prisma = module.get(PrismaService);

    const [owner] = await prisma.$queryRawTyped(
      createUser(
        `owner-${randomUUID()}@gmail.com`,
        'hashed-password',
        'Chat Company Owner',
        'company',
      ),
    );
    companyOwnerId = owner.id.toString();

    const [company] = await prisma.$queryRawTyped(
      createCompany(
        BigInt(companyOwnerId),
        'Chat Test Company',
        'desc',
        'https://test.com',
      ),
    );
    seedCompanyId = company.id.toString();

    const [job] = await prisma.$queryRawTyped(
      createJob(
        BigInt(seedCompanyId),
        'Chat Test Job',
        'description',
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
        'Chat Applicant',
        'applicant',
      ),
    );
    applicantId = applicant.id.toString();

    const applicationQuery = createApplication(
      BigInt(seedJobId),
      BigInt(applicantId),
      'resumes/chat_test.pdf',
    );
    const [created] = await prisma.$queryRawTyped(applicationQuery);
    seedApplicationId = created.id.toString();
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      `DELETE FROM chat_messages WHERE application_id = $1`,
      BigInt(seedApplicationId),
    );
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
    it('should create and return a chat message', async () => {
      const message = await repository.create({
        applicationId: seedApplicationId,
        senderId: applicantId,
        content: 'Hello from applicant',
      });

      expect(message.id).toBeDefined();
      expect(isNaN(Number(message.id))).toBe(false);
      expect(message.applicationId).toBe(seedApplicationId);
      expect(message.senderId).toBe(applicantId);
      expect(message.content).toBe('Hello from applicant');
      expect(message.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('listByApplicationId', () => {
    it('should return messages in chronological order', async () => {
      await repository.create({
        applicationId: seedApplicationId,
        senderId: applicantId,
        content: 'First message',
      });
      await repository.create({
        applicationId: seedApplicationId,
        senderId: companyOwnerId,
        content: 'Second message',
      });

      const messages = await repository.listByApplicationId(
        seedApplicationId,
        50,
        0,
      );

      expect(messages.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < messages.length; i++) {
        expect(messages[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          messages[i - 1].createdAt.getTime(),
        );
      }
    });

    it('should respect pagination limit', async () => {
      const messages = await repository.listByApplicationId(
        seedApplicationId,
        1,
        0,
      );

      expect(messages).toHaveLength(1);
    });

    it('should return empty array for application with no messages', async () => {
      const [newOwner] = await prisma.$queryRawTyped(
        createUser(
          `empty-owner-${randomUUID()}@gmail.com`,
          'hashed-password',
          'Empty Owner',
          'company',
        ),
      );
      const [newCompany] = await prisma.$queryRawTyped(
        createCompany(newOwner.id, 'Empty Company', '', ''),
      );
      const [newJob] = await prisma.$queryRawTyped(
        createJob(newCompany.id, 'Empty Job', '', '', 0, 0),
      );
      const [newApplicant] = await prisma.$queryRawTyped(
        createUser(
          `empty-applicant-${randomUUID()}@gmail.com`,
          'hashed-password',
          'Empty Applicant',
          'applicant',
        ),
      );
      const applicationQuery = createApplication(
        newJob.id,
        newApplicant.id,
        'resumes/empty.pdf',
      );
      const [created] = await prisma.$queryRawTyped(applicationQuery);

      const messages = await repository.listByApplicationId(
        created.id.toString(),
        50,
        0,
      );

      expect(messages).toEqual([]);

      await prisma.$executeRawUnsafe(
        `DELETE FROM chat_messages WHERE application_id = $1`,
        created.id,
      );
      await prisma.application.delete({ where: { id: created.id } });
      await prisma.job.delete({ where: { id: newJob.id } });
      await prisma.company.delete({ where: { id: newCompany.id } });
      await prisma.user.delete({ where: { id: newOwner.id } });
      await prisma.user.delete({ where: { id: newApplicant.id } });
    });
  });

  describe('countByApplicationId', () => {
    it('should return correct count', async () => {
      const count = await repository.countByApplicationId(seedApplicationId);

      expect(count).toBeGreaterThanOrEqual(1);
      expect(typeof count).toBe('number');
    });
  });

  describe('getAccessInfo', () => {
    it('should return applicantUserId and companyUserId', async () => {
      const accessInfo = await repository.getAccessInfo(seedApplicationId);

      expect(accessInfo).not.toBeNull();
      expect(accessInfo?.applicantUserId).toBe(applicantId);
      expect(accessInfo?.companyUserId).toBe(companyOwnerId);
    });

    it('should return null for non-existent application', async () => {
      const accessInfo = await repository.getAccessInfo('999999');

      expect(accessInfo).toBeNull();
    });
  });
});
