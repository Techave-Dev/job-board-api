import 'dotenv/config';
import { Client } from 'pg';
import { execSync } from 'child_process';
import { resolve } from 'path';

export default async function globalSetup() {
  const testUrl = process.env.DATABASE_URL_TEST;
  if (!testUrl) throw new Error('DATABASE_URL_TEST is not set');

  const adminClient = new Client({
    connectionString: testUrl.replace(/\/[^/]+$/, '/postgres'),
  });
  await adminClient.connect();
  const res = await adminClient.query(
    "SELECT 1 FROM pg_database WHERE datname = 'jobboard_test'",
  );
  if (res.rowCount === 0) {
    await adminClient.query('CREATE DATABASE jobboard_test');
  }
  await adminClient.end();

  execSync('pnpm prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testUrl },
    cwd: resolve(__dirname),
  });

  const testClient = new Client({ connectionString: testUrl });
  await testClient.connect();
  await testClient.query(`
    TRUNCATE TABLE
      notifications,
      chat_messages,
      applications,
      attachments,
      jobs,
      companies,
      refresh_tokens,
      users
    CASCADE
  `);
  await testClient.end();
}
