import { INestApplication } from '@nestjs/common';
import { app } from '../setup/db';
import {
  register,
  login,
  getTokens,
  seedCompany,
  authedReq,
  testEmail,
} from '../setup/helpers';

describe('Companies (e2e)', () => {
  let appInstance: INestApplication;

  beforeAll(() => {
    appInstance = app;
  });

  describe('POST /companies', () => {
    it('should create a company as applicant', async () => {
      const email = testEmail('company-create');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Company Creator',
        role: 'applicant',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);

      const res = await authedReq(
        appInstance,
        'post',
        '/companies',
        accessToken,
        {
          name: 'New Company',
          description: 'A new company',
          website: 'https://newcompany.com',
        },
      );

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Company created successfully');
      expect(res.body.data.name).toBe('New Company');
    });

    it('should return 403 when company role tries to create', async () => {
      const email = testEmail('company-role');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Company Role',
        role: 'company',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);

      const res = await authedReq(
        appInstance,
        'post',
        '/companies',
        accessToken,
        {
          name: 'Should Fail',
        },
      );

      expect(res.status).toBe(403);
    });
  });

  describe('GET /companies/:id', () => {
    it('should get company by id (public)', async () => {
      const email = testEmail('company-get');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Company Getter',
        role: 'applicant',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      const company = await seedCompany(appInstance, accessToken);

      const res = await authedReq(
        appInstance,
        'get',
        `/companies/${company.id}`,
        accessToken,
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Company fetched successfully');
      expect(res.body.data.id).toBe(company.id);
    });

    it('should return 404 for non-existent company', async () => {
      const email = testEmail('company-404');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Company 404',
        role: 'applicant',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);

      const res = await authedReq(
        appInstance,
        'get',
        '/companies/99999',
        accessToken,
      );

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /companies/:id', () => {
    it('should update own company', async () => {
      const email = testEmail('company-update');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Company Updater',
        role: 'applicant',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);
      const company = await seedCompany(appInstance, accessToken);

      const res = await authedReq(
        appInstance,
        'patch',
        `/companies/${company.id}`,
        accessToken,
        { name: 'Updated Company' },
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Company updated successfully');
      expect(res.body.data.name).toBe('Updated Company');
    });

    it('should return 403 when updating other company', async () => {
      const ownerEmail = testEmail('company-owner');
      const otherEmail = testEmail('company-other');

      await register(appInstance, {
        email: ownerEmail,
        password: 'password123',
        name: 'Company Owner',
        role: 'applicant',
      });

      await register(appInstance, {
        email: otherEmail,
        password: 'password123',
        name: 'Company Other',
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

      const { accessToken: ownerToken } = getTokens(ownerLoginRes);
      const { accessToken: otherToken } = getTokens(otherLoginRes);

      const company = await seedCompany(appInstance, ownerToken);

      const res = await authedReq(
        appInstance,
        'patch',
        `/companies/${company.id}`,
        otherToken,
        { name: 'Hacked Company' },
      );

      expect(res.status).toBe(403);
    });
  });
});
