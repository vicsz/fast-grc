import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { databaseUrl } from './connection';
import * as schema from './schema';

export const DB = Symbol('DB');
export type Database = NodePgDatabase<typeof schema>;

const pool = { provide: Pool, useFactory: () => new Pool({ connectionString: databaseUrl() }) };
const db = { provide: DB, inject: [Pool], useFactory: (p: Pool) => drizzle({ client: p, schema }) };

@Global()
@Module({ providers: [pool, db], exports: [DB] })
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(Pool) private readonly poolInstance: Pool) {}

  onApplicationShutdown() {
    return this.poolInstance.end();
  }
}
