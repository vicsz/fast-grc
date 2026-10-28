import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { DatabaseModule } from './db/database.module';
import { OrgUnitsModule } from './org-units/org-units.module';
import { SystemController } from './system.controller';

@Module({
  imports: [
    DatabaseModule,
    OrgUnitsModule,
    // The React build (dist/web); API routes are excluded from the SPA fallback.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'web'),
      exclude: ['/api/{*path}', '/health', '/version'],
    }),
  ],
  controllers: [SystemController],
})
export class AppModule {}
