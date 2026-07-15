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

describe('Notifications (e2e)', () => {
  let appInstance: INestApplication;

  beforeAll(() => {
    appInstance = app;
  });

  describe('GET /notifications', () => {
    it('should list notifications when authenticated', async () => {
      const email = testEmail('notif-list');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Notif List',
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
        '/notifications',
        accessToken,
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Notifications fetched successfully');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(appInstance.getHttpServer()).get(
        '/notifications',
      );

      expect(res.status).toBe(401);
    });

    it('should support pagination', async () => {
      const email = testEmail('notif-page');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Notif Page',
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
        '/notifications?page=1&limit=5',
        accessToken,
      );

      expect(res.status).toBe(200);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const email = testEmail('notif-read');
      await register(appInstance, {
        email,
        password: 'password123',
        name: 'Notif Read',
        role: 'applicant',
      });

      const loginRes = await login(appInstance, {
        email,
        password: 'password123',
      });

      const { accessToken } = getTokens(loginRes);

      const listRes = await authedReq(
        appInstance,
        'get',
        '/notifications',
        accessToken,
      );

      if (listRes.body.data.length > 0) {
        const notificationId = listRes.body.data[0].id;

        const res = await authedReq(
          appInstance,
          'patch',
          `/notifications/${notificationId}/read`,
          accessToken,
        );

        expect(res.status).toBe(200);
        expect(res.body.message).toBe(
          'Notification marked as read successfully',
        );
        expect(res.body.data.read).toBe(true);
      }
    });
  });
});
