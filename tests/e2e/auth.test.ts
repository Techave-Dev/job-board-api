import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { app } from '../setup/db';
import {
  register,
  login,
  getTokens,
  authedReq,
  testEmail,
} from '../setup/helpers';

describe('Auth (e2e)', () => {
  let appInstance: INestApplication;

  beforeAll(() => {
    appInstance = app;
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const email = testEmail('register');
      const res = await register(appInstance, {
        email,
        password: 'password123',
        name: 'Register Test',
        role: 'applicant',
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.email).toBe(email);
      expect(res.body.data.name).toBe('Register Test');
      expect(res.body.data.role).toBe('applicant');
      expect(res.body.requestId).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      const email = testEmail('dup');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'First User',
        role: 'applicant',
      });

      const res = await register(appInstance, {
        email,
        password: 'password123',
        name: 'Second User',
        role: 'applicant',
      });

      expect(res.status).toBe(409);
    });

    it('should return 400 for invalid email', async () => {
      const res = await register(appInstance, {
        email: 'not-an-email',
        password: 'password123',
        name: 'Invalid Email',
        role: 'applicant',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const res = await register(appInstance, {
        email: testEmail('short'),
        password: '123',
        name: 'Short Password',
        role: 'applicant',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      const email = testEmail('login');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Login Test',
        role: 'applicant',
      });

      const res = await login(appInstance, {
        email,
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const email = testEmail('wrong');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Wrong Pass',
        role: 'applicant',
      });

      const res = await login(appInstance, {
        email,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      const res = await login(appInstance, {
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
      const email = testEmail('refresh');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Refresh Test',
        role: 'applicant',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { refreshToken } = getTokens(loginRes);

      const res = await request(appInstance.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Token rotated successfully');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for revoked refresh token', async () => {
      const email = testEmail('revoke');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Revoke Test',
        role: 'applicant',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { refreshToken } = getTokens(loginRes);

      await request(appInstance.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken });

      const res = await request(appInstance.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const email = testEmail('logout');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Logout Test',
        role: 'applicant',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { refreshToken } = getTokens(loginRes);

      const res = await request(appInstance.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken });

      expect(res.status).toBe(204);
    });
  });

  describe('GET /users/me', () => {
    it('should return user profile when authenticated', async () => {
      const email = testEmail('profile');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Profile Test',
        role: 'applicant',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);

      const res = await authedReq(appInstance, 'get', '/users/me', accessToken);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Profile fetched successfully');
      expect(res.body.data.email).toBe(email);
      expect(res.body.data.name).toBe('Profile Test');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(appInstance.getHttpServer()).get('/users/me');

      expect(res.status).toBe(401);
    });
  });
});
