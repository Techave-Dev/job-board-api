import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { app } from '../setup/db';
import {
  register,
  login,
  getTokens,
  seedJob,
  authedReq,
  createTestFile,
  testEmail,
} from '../setup/helpers';

describe('Applications (e2e)', () => {
  let appInstance: INestApplication;

  beforeAll(() => {
    appInstance = app;
  });

  describe('POST /jobs/:jobId/applications', () => {
    it('should apply to job as applicant', async () => {
      const applicantEmail = testEmail('apply-applicant');
      const companyEmail = testEmail('apply-company');

      await register(appInstance, {
        email: applicantEmail,
        password: 'password123',
        name: 'Apply Applicant',
        role: 'applicant',
      });

      await register(appInstance, {
        email: companyEmail,
        password: 'password123',
        name: 'Apply Company',
        role: 'company',
      });

      const companyLoginRes = await login(appInstance, {
        email: companyEmail,
        password: 'password123',
      });

      const applicantLoginRes = await login(appInstance, {
        email: applicantEmail,
        password: 'password123',
      });

      const { accessToken: companyToken } = getTokens(companyLoginRes);
      const { accessToken: applicantToken } = getTokens(applicantLoginRes);

      const job = await seedJob(appInstance, companyToken);
      const fileBuffer = createTestFile('resume.pdf', 'application/pdf');

      const res = await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/applications`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .attach('file', fileBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Application submitted successfully');
    });

    it('should return 403 when company tries to apply', async () => {
      const companyEmail = testEmail('apply-company2');

      await register(appInstance, {
        email: companyEmail,
        password: 'password123',
        name: 'Apply Company 2',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email: companyEmail,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      const job = await seedJob(appInstance, accessToken);
      const fileBuffer = createTestFile('resume.pdf', 'application/pdf');

      const res = await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/applications`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(403);
    });

    it('should return 409 for duplicate application', async () => {
      const applicantEmail = testEmail('apply-dup');
      const companyEmail = testEmail('apply-dup-co');

      await register(appInstance, {
        email: applicantEmail,
        password: 'password123',
        name: 'Apply Dup',
        role: 'applicant',
      });

      await register(appInstance, {
        email: companyEmail,
        password: 'password123',
        name: 'Apply Dup Company',
        role: 'company',
      });

      const companyLoginRes = await login(appInstance, {
        email: companyEmail,
        password: 'password123',
      });

      const applicantLoginRes = await login(appInstance, {
        email: applicantEmail,
        password: 'password123',
      });

      const { accessToken: companyToken } = getTokens(companyLoginRes);
      const { accessToken: applicantToken } = getTokens(applicantLoginRes);

      const job = await seedJob(appInstance, companyToken);
      const fileBuffer = createTestFile('resume.pdf', 'application/pdf');

      await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/applications`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .attach('file', fileBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      const fileBuffer2 = createTestFile('resume2.pdf', 'application/pdf');
      const res = await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/applications`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .attach('file', fileBuffer2, {
          filename: 'resume2.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /applications', () => {
    it('should list my applications as applicant', async () => {
      const applicantEmail = testEmail('list-applicant');
      const companyEmail = testEmail('list-company');

      await register(appInstance, {
        email: applicantEmail,
        password: 'password123',
        name: 'List Applicant',
        role: 'applicant',
      });

      await register(appInstance, {
        email: companyEmail,
        password: 'password123',
        name: 'List Company',
        role: 'company',
      });

      const companyLoginRes = await login(appInstance, {
        email: companyEmail,
        password: 'password123',
      });

      const applicantLoginRes = await login(appInstance, {
        email: applicantEmail,
        password: 'password123',
      });

      const { accessToken: companyToken } = getTokens(companyLoginRes);
      const { accessToken: applicantToken } = getTokens(applicantLoginRes);

      const job = await seedJob(appInstance, companyToken);
      const fileBuffer = createTestFile('resume.pdf', 'application/pdf');

      await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/applications`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .attach('file', fileBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      const res = await authedReq(
        appInstance,
        'get',
        '/applications',
        applicantToken,
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Applications fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 403 when company tries to list /applications', async () => {
      const companyEmail = testEmail('list-company2');

      await register(appInstance, {
        email: companyEmail,
        password: 'password123',
        name: 'List Company 2',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email: companyEmail,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);

      const res = await authedReq(
        appInstance,
        'get',
        '/applications',
        accessToken,
      );

      expect(res.status).toBe(403);
    });
  });

  describe('GET /jobs/:jobId/applications', () => {
    it('should list applications for job as company owner', async () => {
      const ownerEmail = testEmail('job-app-owner');
      const applicantEmail = testEmail('job-applicant');

      await register(appInstance, {
        email: ownerEmail,
        password: 'password123',
        name: 'Job App Owner',
        role: 'company',
      });

      await register(appInstance, {
        email: applicantEmail,
        password: 'password123',
        name: 'Job Applicant',
        role: 'applicant',
      });

      const companyLoginRes = await login(appInstance, {
        email: ownerEmail,
        password: 'password123',
      });

      const applicantLoginRes = await login(appInstance, {
        email: applicantEmail,
        password: 'password123',
      });

      const { accessToken: companyToken } = getTokens(companyLoginRes);
      const { accessToken: applicantToken } = getTokens(applicantLoginRes);

      const job = await seedJob(appInstance, companyToken);
      const fileBuffer = createTestFile('resume.pdf', 'application/pdf');

      await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/applications`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .attach('file', fileBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      const res = await authedReq(
        appInstance,
        'get',
        `/jobs/${job.id}/applications`,
        companyToken,
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Applications fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 403 when non-owner tries to list applications', async () => {
      const ownerEmail = testEmail('job-app-owner2');
      const otherEmail = testEmail('job-app-other');

      await register(appInstance, {
        email: ownerEmail,
        password: 'password123',
        name: 'Job App Owner 2',
        role: 'company',
      });

      await register(appInstance, {
        email: otherEmail,
        password: 'password123',
        name: 'Job App Other',
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
        'get',
        `/jobs/${job.id}/applications`,
        otherToken,
      );

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /applications/:id/status', () => {
    it('should update status as company owner', async () => {
      const ownerEmail = testEmail('status-owner');
      const applicantEmail = testEmail('status-applicant');

      await register(appInstance, {
        email: ownerEmail,
        password: 'password123',
        name: 'Status Owner',
        role: 'company',
      });

      await register(appInstance, {
        email: applicantEmail,
        password: 'password123',
        name: 'Status Applicant',
        role: 'applicant',
      });

      const companyLoginRes = await login(appInstance, {
        email: ownerEmail,
        password: 'password123',
      });

      const applicantLoginRes = await login(appInstance, {
        email: applicantEmail,
        password: 'password123',
      });

      const { accessToken: companyToken } = getTokens(companyLoginRes);
      const { accessToken: applicantToken } = getTokens(applicantLoginRes);

      const job = await seedJob(appInstance, companyToken);
      const fileBuffer = createTestFile('resume.pdf', 'application/pdf');

      const applyRes = await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/applications`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .attach('file', fileBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      const applicationId = applyRes.body.data.id;

      const res = await authedReq(
        appInstance,
        'patch',
        `/applications/${applicationId}/status`,
        companyToken,
        { status: 'accepted' },
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Application status updated successfully');
      expect(res.body.data.status).toBe('accepted');
    });

    it('should return 403 when non-owner tries to update status', async () => {
      const ownerEmail = testEmail('status-owner2');
      const otherEmail = testEmail('status-other');
      const applicantEmail = testEmail('status-app2');

      await register(appInstance, {
        email: ownerEmail,
        password: 'password123',
        name: 'Status Owner 2',
        role: 'company',
      });

      await register(appInstance, {
        email: otherEmail,
        password: 'password123',
        name: 'Status Other',
        role: 'company',
      });

      await register(appInstance, {
        email: applicantEmail,
        password: 'password123',
        name: 'Status App 2',
        role: 'applicant',
      });

      const ownerLoginRes = await login(appInstance, {
        email: ownerEmail,
        password: 'password123',
      });

      const otherLoginRes = await login(appInstance, {
        email: otherEmail,
        password: 'password123',
      });

      const applicantLoginRes = await login(appInstance, {
        email: applicantEmail,
        password: 'password123',
      });

      const { accessToken: ownerToken } = getTokens(ownerLoginRes);
      const { accessToken: otherToken } = getTokens(otherLoginRes);
      const { accessToken: applicantToken } = getTokens(applicantLoginRes);

      const job = await seedJob(appInstance, ownerToken);
      const fileBuffer = createTestFile('resume.pdf', 'application/pdf');

      const applyRes = await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/applications`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .attach('file', fileBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      const applicationId = applyRes.body.data.id;

      const res = await authedReq(
        appInstance,
        'patch',
        `/applications/${applicationId}/status`,
        otherToken,
        { status: 'accepted' },
      );

      expect(res.status).toBe(403);
    });
  });
});
