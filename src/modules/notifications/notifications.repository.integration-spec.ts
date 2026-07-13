import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsRepository } from './notifications.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificationsRepository (Integration Test)', () => {
  let repository: NotificationsRepository;
  let module: TestingModule;
  let prisma: PrismaService;
  let seedUserId: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [NotificationsRepository],
    }).compile();

    repository = module.get(NotificationsRepository);
    prisma = module.get(PrismaService);

    const tempUserEmail = `test.notification.${Date.now()}@gmail.com`;
    const user = await prisma.user.create({
      data: {
        email: tempUserEmail,
        name: 'Test Notif User',
        password: 'mock-hash',
        role: 'applicant',
      },
    });

    seedUserId = user.id.toString();
  });

  afterAll(async () => {
    if (seedUserId) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "notifications" CASCADE;`);
      await prisma.user
        .delete({ where: { id: BigInt(seedUserId) } })
        .catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create and return a new notification with formatted jsonb data', async () => {
      const notification = await repository.create({
        userId: seedUserId,
        type: 'new_job',
        title: 'New job available',
        message: 'A new backend nodejs position is open',
        data: { jobId: '99' },
      });

      expect(notification.id).toBeDefined();
      expect(isNaN(Number(notification.id))).toBe(false);
      expect(notification.userId).toBe(seedUserId);
      expect(notification.type).toBe('new_job');
      expect(notification.read).toBe(false);
      expect(notification.data).toEqual({ jobId: '99' });
      expect(notification.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('listByUserId', () => {
    it('should return list of notifications for specific user', async () => {
      const created = await repository.create({
        userId: seedUserId,
        type: 'new_message',
        title: 'New message',
        message: 'Hello there',
        data: { chatId: '1' },
      });

      const list = await repository.listByUserId(seedUserId, null, 10, 0);
      expect(list.length).toBeGreaterThan(0);
      const found = list.find((n) => n.id === created.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe('New message');
    });

    it('should filter only unread notifications when unread parameter is true', async () => {
      const created = await repository.create({
        userId: seedUserId,
        type: 'application_update',
        title: 'Unread notification',
        message: 'Application status info',
        data: {},
      });

      const list = await repository.listByUserId(seedUserId, true, 10, 0);
      const found = list.find((n) => n.id === created.id);
      expect(found).toBeDefined();
      expect(found?.read).toBe(false);
    });
  });

  describe('countByUserId & countUnreadByUserId', () => {
    it('should return correct total and unread count metrics', async () => {
      const total = await repository.countByUserId(seedUserId, null);
      const unread = await repository.countUnreadByUserId(seedUserId);

      expect(typeof total).toBe('number');
      expect(typeof unread).toBe('number');
      expect(total).toBeGreaterThanOrEqual(unread);
    });
  });

  describe('findById', () => {
    it('should return compact owner check object if exists', async () => {
      const created = await repository.create({
        userId: seedUserId,
        type: 'application_update',
        title: 'Status updated',
        message: 'Your application has been accepted',
        data: { appId: '5' },
      });

      const result = await repository.findById(created.id);
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
      expect(result?.userId).toBe(seedUserId);
      expect(result?.read).toBe(false);
    });

    it('should return null if notification record does not exist', async () => {
      const nonExistentBigIntId = '999999999';
      const result = await repository.findById(nonExistentBigIntId);
      expect(result).toBeNull();
    });
  });

  describe('markAsRead', () => {
    it('should update and return notification status to read true', async () => {
      const created = await repository.create({
        userId: seedUserId,
        type: 'new_job',
        title: 'Read test',
        message: 'Testing read status',
        data: {},
      });

      const updated = await repository.markAsRead(created.id);
      expect(updated.read).toBe(true);
    });

    it('should throw error if attempting to mark non-existent notification as read', async () => {
      const nonExistentBigIntId = '999999999';
      await expect(
        repository.markAsRead(nonExistentBigIntId),
      ).rejects.toThrow();
    });
  });
});
