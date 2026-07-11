import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { createUser } from '../../generated/prisma/sql';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let module: TestingModule;
  let seedUserId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [UsersRepository],
    }).compile();
    repository = module.get(UsersRepository);

    const prisma = module.get(PrismaService);
    const [user] = await prisma.$queryRawTyped(
      createUser(
        `seed-${randomUUID()}@gmail.com`,
        'hashed-password',
        'Seed User',
        'applicant',
      ),
    );
    seedUserId = user.id.toString();
  });

  afterAll(async () => {
    const prisma = module.get(PrismaService);
    await prisma.user.delete({ where: { id: BigInt(seedUserId) } });
    await prisma.$disconnect();
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const user = await repository.findById(seedUserId);
      expect(user).not.toBeNull();
      expect(user!.id).toBe(seedUserId);
      expect(user!.email).toBeDefined();
      expect(user!.name).toBe('Seed User');
      expect(user!.role).toBe('applicant');
      expect(user!.createdAt).toBeInstanceOf(Date);
      expect(user!.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent id', async () => {
      const user = await repository.findById('999999');
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const prisma = module.get(PrismaService);
      const email = `find-${randomUUID()}@gmail.com`;
      const [created] = await prisma.$queryRawTyped(
        createUser(email, 'hashed-password', 'Find User', 'company'),
      );

      const user = await repository.findByEmail(email);
      expect(user).not.toBeNull();
      expect(user!.email).toBe(email);
      expect(user!.name).toBe('Find User');
      expect(user!.role).toBe('company');

      await prisma.user.delete({ where: { id: created.id } });
    });

    it('should return null for non-existent email', async () => {
      const user = await repository.findByEmail(
        `nonexistent-${randomUUID()}@gmail.com`,
      );
      expect(user).toBeNull();
    });
  });

  describe('updateById', () => {
    it('should update name and return updated user', async () => {
      const prisma = module.get(PrismaService);
      const originalEmail = `update-name-${randomUUID()}@gmail.com`;
      const [created] = await prisma.$queryRawTyped(
        createUser(
          originalEmail,
          'hashed-password',
          'Original Name',
          'applicant',
        ),
      );
      const userId = created.id.toString();

      const updated = await repository.updateById(userId, {
        name: 'Updated Name',
      });

      expect(updated.id).toBe(userId);
      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe(originalEmail);

      await prisma.user.delete({ where: { id: created.id } });
    });

    it('should update email and return updated user', async () => {
      const prisma = module.get(PrismaService);
      const newEmail = `updated-${randomUUID()}@gmail.com`;
      const [created] = await prisma.$queryRawTyped(
        createUser(
          `before-update-${randomUUID()}@gmail.com`,
          'hashed-password',
          'Email User',
          'applicant',
        ),
      );
      const userId = created.id.toString();

      const updated = await repository.updateById(userId, {
        email: newEmail,
      });

      expect(updated.id).toBe(userId);
      expect(updated.email).toBe(newEmail);

      await prisma.user.delete({ where: { id: created.id } });
    });

    it('should update both name and email', async () => {
      const prisma = module.get(PrismaService);
      const newEmail = `both-${randomUUID()}@gmail.com`;
      const [created] = await prisma.$queryRawTyped(
        createUser(
          `before-both-${randomUUID()}@gmail.com`,
          'hashed-password',
          'Both User',
          'company',
        ),
      );
      const userId = created.id.toString();

      const updated = await repository.updateById(userId, {
        name: 'Both Updated',
        email: newEmail,
      });

      expect(updated.id).toBe(userId);
      expect(updated.name).toBe('Both Updated');
      expect(updated.email).toBe(newEmail);

      await prisma.user.delete({ where: { id: created.id } });
    });
  });
});
