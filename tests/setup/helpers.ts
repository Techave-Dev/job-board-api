import { randomUUID } from 'crypto';
import request, { type Response } from 'supertest';
import { INestApplication } from '@nestjs/common';
import { prisma } from './db';
import * as bcrypt from 'bcrypt';

export function testEmail(name: string): string {
  return `${name}-${randomUUID().slice(0, 8)}@test.com`;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: 'applicant' | 'company';
}

interface LoginInput {
  email: string;
  password: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export async function seedUser(data: RegisterInput) {
  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      email: data.email,
      password: passwordHash,
      name: data.name,
      role: data.role,
    },
  });
}

export async function register(app: INestApplication, data: RegisterInput): Promise<Response> {
  return request(app.getHttpServer()).post('/auth/register').send(data);
}

export async function login(app: INestApplication, data: LoginInput): Promise<Response> {
  return request(app.getHttpServer()).post('/auth/login').send(data);
}

export function getTokens(res: { body: { data: Tokens } }): Tokens {
  return {
    accessToken: res.body.data.accessToken,
    refreshToken: res.body.data.refreshToken,
  };
}

export async function authedReq(
  app: INestApplication,
  method: 'get' | 'post' | 'patch' | 'delete',
  url: string,
  token: string,
  body?: unknown,
): Promise<Response> {
  const req = request(app.getHttpServer())
    [method](url)
    .set('Authorization', `Bearer ${token}`);

  if (body && ['post', 'patch'].includes(method)) {
    req.send(body);
  }

  return req;
}

export async function seedCompany(app: INestApplication, token: string) {
  const [, payloadB64] = token.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
  const userId = payload.sub;

  const existing = await prisma.$queryRawUnsafe(
    `SELECT id FROM companies WHERE user_id = $1`,
    BigInt(userId),
  );
  if ((existing as any[]).length === 0) {
    await prisma.$queryRawUnsafe(
      `INSERT INTO companies (user_id, name, description, website) VALUES ($1, $2, $3, $4)`,
      BigInt(userId),
      'Test Company',
      'Test description',
      'https://test.com',
    );
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, name, description, website, logo_url as "logoUrl", created_at as "createdAt" FROM companies WHERE user_id = $1`,
    BigInt(userId),
  );
  const row = (rows as any[])[0];
  row.id = row.id.toString();
  return row;
}

export async function seedJob(
  app: INestApplication,
  token: string,
  data?: Record<string, unknown>,
) {
  const [, payloadB64] = token.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
  const userId = payload.sub;

  const existing = await prisma.$queryRawUnsafe(
    `SELECT id FROM companies WHERE user_id = $1`,
    BigInt(userId),
  );
  if ((existing as any[]).length === 0) {
    await prisma.$queryRawUnsafe(
      `INSERT INTO companies (user_id, name, description, website) VALUES ($1, $2, $3, $4)`,
      BigInt(userId),
      'Test Company',
      'Test description',
      'https://test.com',
    );
  }

  const res = await request(app.getHttpServer())
    .post('/jobs')
    .set('Authorization', `Bearer ${token}`)
    .send(
      data || {
        title: 'Software Engineer',
        description: 'Test job description',
        location: 'Jakarta',
        salaryMin: 5000000,
        salaryMax: 10000000,
      },
    );

  return res.body.data;
}

export function createTestFile(
  filename: string = 'test.pdf',
  mimeType: string = 'application/pdf',
  size: number = 1024,
) {
  return Buffer.alloc(size, `test file content for ${filename}`);
}
