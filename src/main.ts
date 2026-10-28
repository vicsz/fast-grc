import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { migrateDatabase } from './db/migrate';

async function bootstrap() {
  // Schema first: a failed migration stops startup, so the deploy's /version check fails loudly.
  await migrateDatabase(undefined, { resetOnDrift: process.env.DB_RESET_ON_DRIFT === 'true' });

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
