import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { app } from '../setup/db';
import {
  register,
  login,
  getTokens,
  seedCompany,
  seedJob,
  authedReq,
  createTestFile,
  testEmail,
} from '../setup/helpers';

describe('Jobs (e2e)', () => {
  let appInstance: INestApplication;

  beforeAll(() => {
    appInstance = app;
  });

  describe('POST /jobs', () => {
    it('should create a job as company', async () => {
      const email = testEmail('job-create');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Job Creator',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      await seedCompany(appInstance, accessToken);

      const res = await authedReq(appInstance, 'post', '/jobs', accessToken, {
        title: 'Software Engineer',
        description: 'Test job',
        location: 'Jakarta',
        salaryMin: 5000000,
        salaryMax: 10000000,
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Job created successfully');
      expect(res.body.data.title).toBe('Software Engineer');
    });

    it('should return 403 when applicant tries to create job', async () => {
      const email = testEmail('job-applicant');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Job Applicant',
        role: 'applicant',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);

      const res = await authedReq(appInstance, 'post', '/jobs', accessToken, {
        title: 'Should Fail',
        description: 'Test',
      });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /jobs', () => {
    it('should list jobs (public)', async () => {
      const email = testEmail('job-list');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Job Lister',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      await seedJob(appInstance, accessToken, {
        title: 'Backend Developer',
        description: 'Node.js developer',
        location: 'Jakarta',
      });

      const res = await request(appInstance.getHttpServer()).get('/jobs');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Jobs fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('should filter jobs by search', async () => {
      const email = testEmail('job-search');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Job Searcher',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      await seedJob(appInstance, accessToken, {
        title: 'Frontend Developer',
        description: 'React developer',
        location: 'Bandung',
      });

      const res = await request(appInstance.getHttpServer()).get(
        '/jobs?search=Frontend',
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter jobs by location', async () => {
      const email = testEmail('job-location');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Job Location',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      await seedJob(appInstance, accessToken, {
        title: 'Mobile Developer',
        description: 'Flutter developer',
        location: 'Surabaya',
      });

      const res = await request(appInstance.getHttpServer()).get(
        '/jobs?location=Surabaya',
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /jobs/:id', () => {
    it('should get job by id (public)', async () => {
      const email = testEmail('job-get');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Job Getter',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      const job = await seedJob(appInstance, accessToken);

      const res = await request(appInstance.getHttpServer()).get(
        `/jobs/${job.id}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Job fetched successfully');
      expect(res.body.data.id).toBe(job.id);
    });

    it('should return 404 for non-existent job', async () => {
      const res = await request(appInstance.getHttpServer()).get('/jobs/99999');

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /jobs/:id', () => {
    it('should update own job', async () => {
      const email = testEmail('job-update');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Job Updater',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      const job = await seedJob(appInstance, accessToken);

      const res = await authedReq(
        appInstance,
        'patch',
        `/jobs/${job.id}`,
        accessToken,
        { title: 'Updated Job Title' },
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Job updated successfully');
      expect(res.body.data.title).toBe('Updated Job Title');
    });

    it('should return 403 when updating other job', async () => {
      const ownerEmail = testEmail('job-owner');
      const otherEmail = testEmail('job-other');

      await register(appInstance, {
        email: ownerEmail,
        password: 'password123',
        name: 'Job Owner',
        role: 'company',
      });

      await register(appInstance, {
        email: otherEmail,
        password: 'password123',
        name: 'Job Other',
        role: 'company',
      });

      const ownerLoginRes = await login(appInstance, {
        email: ownerEmail,
        password: 'password123',
      });

      const otherLoginRes = await login(appInstance, {
        email: otherEmail,
        password: 'password123',
      });

      const { accessToken: ownerToken } = getTokens(ownerLoginRes);
      const { accessToken: otherToken } = getTokens(otherLoginRes);

      const job = await seedJob(appInstance, ownerToken);

      const res = await authedReq(
        appInstance,
        'patch',
        `/jobs/${job.id}`,
        otherToken,
        { title: 'Hacked Job' },
      );

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /jobs/:id', () => {
    it('should delete own job', async () => {
      const email = testEmail('job-delete');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Job Deleter',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      const job = await seedJob(appInstance, accessToken);

      const res = await authedReq(
        appInstance,
        'delete',
        `/jobs/${job.id}`,
        accessToken,
      );

      expect(res.status).toBe(204);
    });

    it('should return 403 when deleting other job', async () => {
      const ownerEmail = testEmail('job-del-owner');
      const otherEmail = testEmail('job-del-other');

      await register(appInstance, {
        email: ownerEmail,
        password: 'password123',
        name: 'Job Del Owner',
        role: 'company',
      });

      await register(appInstance, {
        email: otherEmail,
        password: 'password123',
        name: 'Job Del Other',
        role: 'company',
      });

      const ownerLoginRes = await login(appInstance, {
        email: ownerEmail,
        password: 'password123',
      });

      const otherLoginRes = await login(appInstance, {
        email: otherEmail,
        password: 'password123',
      });

      const { accessToken: ownerToken } = getTokens(ownerLoginRes);
      const { accessToken: otherToken } = getTokens(otherLoginRes);

      const job = await seedJob(appInstance, ownerToken);

      const res = await authedReq(
        appInstance,
        'delete',
        `/jobs/${job.id}`,
        otherToken,
      );

      expect(res.status).toBe(403);
    });
  });

  describe('POST /jobs/:id/attachments', () => {
    it('should upload attachment to own job', async () => {
      const email = testEmail('att-upload');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Att Uploader',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      const job = await seedJob(appInstance, accessToken);
      const fileBuffer = createTestFile('resume.pdf', 'application/pdf');

      const res = await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/attachments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Attachment uploaded successfully');
    });

    it('should return 403 when uploading to other job', async () => {
      const ownerEmail = testEmail('att-owner');
      const otherEmail = testEmail('att-other');

      await register(appInstance, {
        email: ownerEmail,
        password: 'password123',
        name: 'Att Owner',
        role: 'company',
      });

      await register(appInstance, {
        email: otherEmail,
        password: 'password123',
        name: 'Att Other',
        role: 'company',
      });

      const ownerLoginRes = await login(appInstance, {
        email: ownerEmail,
        password: 'password123',
      });

      const otherLoginRes = await login(appInstance, {
        email: otherEmail,
        password: 'password123',
      });

      const { accessToken: ownerToken } = getTokens(ownerLoginRes);
      const { accessToken: otherToken } = getTokens(otherLoginRes);

      const job = await seedJob(appInstance, ownerToken);
      const fileBuffer = createTestFile('resume.pdf', 'application/pdf');

      const res = await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/attachments`)
        .set('Authorization', `Bearer ${otherToken}`)
        .attach('file', fileBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /jobs/:jobId/attachments/:attachmentId', () => {
    it('should delete own attachment', async () => {
      const email = testEmail('att-del');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Att Deleter',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      const job = await seedJob(appInstance, accessToken);
      const fileBuffer = createTestFile('resume.pdf', 'application/pdf');

      const uploadRes = await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/attachments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      const attachmentId = uploadRes.body.data.id;

      const res = await authedReq(
        appInstance,
        'delete',
        `/jobs/${job.id}/attachments/${attachmentId}`,
        accessToken,
      );

      expect(res.status).toBe(204);
    });

    it('should return 403 when deleting other attachment', async () => {
      const ownerEmail = testEmail('att-del-owner');
      const otherEmail = testEmail('att-del-other');

      await register(appInstance, {
        email: ownerEmail,
        password: 'password123',
        name: 'Att Del Owner',
        role: 'company',
      });

      await register(appInstance, {
        email: otherEmail,
        password: 'password123',
        name: 'Att Del Other',
        role: 'company',
      });

      const ownerLoginRes = await login(appInstance, {
        email: ownerEmail,
        password: 'password123',
      });

      const otherLoginRes = await login(appInstance, {
        email: otherEmail,
        password: 'password123',
      });

      const { accessToken: ownerToken } = getTokens(ownerLoginRes);
      const { accessToken: otherToken } = getTokens(otherLoginRes);

      const job = await seedJob(appInstance, ownerToken);
      const fileBuffer = createTestFile('resume.pdf', 'application/pdf');

      const uploadRes = await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/attachments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .attach('file', fileBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      const attachmentId = uploadRes.body.data.id;

      const res = await authedReq(
        appInstance,
        'delete',
        `/jobs/${job.id}/attachments/${attachmentId}`,
        otherToken,
      );

      expect(res.status).toBe(403);
    });
  });
});
