import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { SystemController } from './system.controller';

@Module({
  imports: [
    // The React build (dist/web); API routes are excluded from the SPA fallback.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'web'),
      exclude: ['/api/{*path}', '/health', '/version'],
    }),
  ],
  controllers: [SystemController],
})
export class AppModule {}
