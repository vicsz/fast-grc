import { Client } from 'pg';
import { migrateDatabase } from '../src/db/migrate';
import { adminUrl, testUrl } from './test-db';

export default async function globalSetup() {
  const admin = new Client({ connectionString: adminUrl });
  try {
    await admin.connect();
  } catch {
    throw new Error(`No Postgres at ${adminUrl}. Start it with: npm run db:up`);
  }
  await admin.query('DROP DATABASE IF EXISTS fast_grc_test WITH (FORCE)');
  await admin.query('CREATE DATABASE fast_grc_test');
  await admin.end();
  await migrateDatabase(testUrl, { log: () => undefined });
}
