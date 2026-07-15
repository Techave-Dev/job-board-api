import { createApp, closeApp } from './db';

beforeAll(async () => {
  if (!process.env.DATABASE_URL_TEST) return;
  await createApp();
}, 30000);

afterAll(async () => {
  if (!process.env.DATABASE_URL_TEST) return;
  await closeApp();
});
