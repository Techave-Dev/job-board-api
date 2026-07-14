import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '../../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { AppModule } from '../../src/app.module';

let app: INestApplication;
let prisma: PrismaClient;

export async function createApp() {
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) throw new Error('DATABASE_URL_TEST is not set');
  process.env.DATABASE_URL = testUrl;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  await app.init();

  const adapter = new PrismaPg(testUrl);
  prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  return { app, prisma };
}

export async function closeApp() {
  await prisma.$disconnect();
  await app.close();
}

export async function truncateAll() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE 
      notifications, 
      chat_messages, 
      applications, 
      attachments, 
      jobs, 
      companies, 
      refresh_tokens, 
      users 
    CASCADE
  `);
}

export { app, prisma };
