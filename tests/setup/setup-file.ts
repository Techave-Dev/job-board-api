import { createApp, closeApp } from './db';

beforeAll(async () => {
  await createApp();
}, 30000);

afterAll(async () => {
  await closeApp();
});
