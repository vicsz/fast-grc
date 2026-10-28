import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { databaseUrl } from './connection';
import { seed } from './seed';

const migrationsFolder = join(__dirname, '..', '..', 'drizzle');
const LOCK_ID = 727274; // any constant: one migrator at a time across instances

type Options = { resetOnDrift?: boolean; log?: (message: string) => void };

// Runs at startup, before the app serves traffic: migrate forward, then seed an empty database.
// If the database has migrations this build doesn't know (an older build was deployed), either
// reset and replay (dev) or refuse to start (everywhere else).
export async function migrateDatabase(url = databaseUrl(), options: Options = {}) {
  const log = options.log ?? console.log;
  const pool = new Pool({ connectionString: url, max: 1 });
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);

    const drift = await unknownMigrations(client);
    if (drift > 0) {
      if (!options.resetOnDrift) {
        throw new Error(
          `Database has ${drift} migration(s) this build doesn't know. Deploy a newer build, or reset the database.`,
        );
      }
      log(`Database is ${drift} migration(s) ahead of this build: resetting`);
      await client.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
      await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
    }

    const db = drizzle({ client });
    await migrate(db, { migrationsFolder });
    const seeded = await seed(db);
    log(seeded ? `Migrated and seeded ${seeded} org units` : 'Migrated');
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => undefined);
    client.release();
    await pool.end();
  }
}

async function unknownMigrations(client: { query: Pool['query'] }) {
  const exists = await client.query(`SELECT to_regclass('drizzle.__drizzle_migrations') AS t`);
  if (!exists.rows[0].t) return 0;
  const journal = JSON.parse(readFileSync(join(migrationsFolder, 'meta', '_journal.json'), 'utf8'));
  const known = new Set<string>(journal.entries.map((e: { when: number }) => String(e.when)));
  const applied = await client.query('SELECT created_at FROM drizzle.__drizzle_migrations');
  return applied.rows.filter((r) => !known.has(String(r.created_at))).length;
}
