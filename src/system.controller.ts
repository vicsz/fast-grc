import { Controller, Get } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Written by scripts/stamp-version.mjs at build time; sits next to dist/.
const buildInfo = JSON.parse(readFileSync(join(__dirname, '..', 'build-info.json'), 'utf8'));

@Controller()
export class SystemController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('version')
  version() {
    return { ...buildInfo, environment: process.env.APP_ENV ?? 'local' };
  }
}
