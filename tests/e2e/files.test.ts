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

describe('Files (e2e)', () => {
  let appInstance: INestApplication;

  beforeAll(() => {
    appInstance = app;
  });

  describe('GET /files/:type/:id', () => {
    it('should get logo URL (public)', async () => {
      const email = testEmail('file-logo');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'File Logo',
        role: 'applicant',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      const company = await seedCompany(appInstance, accessToken);

      const fileBuffer = createTestFile('logo.png', 'image/png');
      await request(appInstance.getHttpServer())
        .post(`/companies/${company.id}/logo`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileBuffer, {
          filename: 'logo.png',
          contentType: 'image/png',
        });

      const res = await request(appInstance.getHttpServer())
        .get(`/files/logos/${company.id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('File fetched successfully');
      expect(res.body.data.url).toBeDefined();
    });

    it('should return 401 when getting resume without auth', async () => {
      const res = await request(appInstance.getHttpServer()).get(
        '/files/resumes/1',
      );

      expect(res.status).toBe(401);
    });

    it('should get resume URL when authenticated (owner)', async () => {
      const companyEmail = testEmail('file-resume-co');
      const applicantEmail = testEmail('file-resume-app');

      await register(appInstance, {
        email: companyEmail,
        password: 'password123',
        name: 'File Resume Company',
        role: 'company',
      });

      await register(appInstance, {
        email: applicantEmail,
        password: 'password123',
        name: 'File Resume Applicant',
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
        `/files/resumes/${applicationId}`,
        applicantToken,
      );

      expect(res.status).toBe(200);
      expect(res.body.data.url).toBeDefined();
    });

    it('should get attachment URL when authenticated (owner)', async () => {
      const email = testEmail('file-att');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'File Att',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      const job = await seedJob(appInstance, accessToken);

      const fileBuffer = createTestFile('attachment.pdf', 'application/pdf');
      const uploadRes = await request(appInstance.getHttpServer())
        .post(`/jobs/${job.id}/attachments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fileBuffer, {
          filename: 'attachment.pdf',
          contentType: 'application/pdf',
        });

      const attachmentId = uploadRes.body.data.id;

      const res = await authedReq(
        appInstance,
        'get',
        `/files/attachments/${attachmentId}`,
        accessToken,
      );

      expect(res.status).toBe(200);
      expect(res.body.data.url).toBeDefined();
    });
  });
});
