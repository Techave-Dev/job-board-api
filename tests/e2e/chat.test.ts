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

describe('Chat (e2e)', () => {
  let appInstance: INestApplication;

  beforeAll(() => {
    appInstance = app;
  });

  describe('GET /chat/:applicationId/messages', () => {
    it('should get messages as applicant', async () => {
      const applicantEmail = testEmail('chat-applicant');
      const companyEmail = testEmail('chat-company');

      await register(appInstance, {
        email: applicantEmail,
        password: 'password123',
        name: 'Chat Applicant',
        role: 'applicant',
      });

      await register(appInstance, {
        email: companyEmail,
        password: 'password123',
        name: 'Chat Company',
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
        'get',
        `/chat/${applicationId}/messages`,
        applicantToken,
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Messages fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should get messages as company owner', async () => {
      const applicantEmail = testEmail('chat-app2');
      const companyEmail = testEmail('chat-co2');

      await register(appInstance, {
        email: applicantEmail,
        password: 'password123',
        name: 'Chat App 2',
        role: 'applicant',
      });

      await register(appInstance, {
        email: companyEmail,
        password: 'password123',
        name: 'Chat Co 2',
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
        'get',
        `/chat/${applicationId}/messages`,
        companyToken,
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Messages fetched successfully');
    });

    it('should return 403 for unauthorized user', async () => {
      const applicantEmail = testEmail('chat-app3');
      const companyEmail = testEmail('chat-co3');
      const otherEmail = testEmail('chat-other');

      await register(appInstance, {
        email: applicantEmail,
        password: 'password123',
        name: 'Chat App 3',
        role: 'applicant',
      });

      await register(appInstance, {
        email: companyEmail,
        password: 'password123',
        name: 'Chat Co 3',
        role: 'company',
      });

      await register(appInstance, {
        email: otherEmail,
        password: 'password123',
        name: 'Chat Other',
        role: 'applicant',
      });

      const companyLoginRes = await login(appInstance, {
        email: companyEmail,
        password: 'password123',
      });

      const applicantLoginRes = await login(appInstance, {
        email: applicantEmail,
        password: 'password123',
      });

      const otherLoginRes = await login(appInstance, {
        email: otherEmail,
        password: 'password123',
      });

      const { accessToken: companyToken } = getTokens(companyLoginRes);
      const { accessToken: applicantToken } = getTokens(applicantLoginRes);
      const { accessToken: otherToken } = getTokens(otherLoginRes);

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
        'get',
        `/chat/${applicationId}/messages`,
        otherToken,
      );

      expect(res.status).toBe(403);
    });

    it('should support pagination', async () => {
      const applicantEmail = testEmail('chat-page');
      const companyEmail = testEmail('chat-page-co');

      await register(appInstance, {
        email: applicantEmail,
        password: 'password123',
        name: 'Chat Page',
        role: 'applicant',
      });

      await register(appInstance, {
        email: companyEmail,
        password: 'password123',
        name: 'Chat Page Co',
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
        'get',
        `/chat/${applicationId}/messages?page=1&limit=10`,
        applicantToken,
      );

      expect(res.status).toBe(200);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
    });
  });
});
