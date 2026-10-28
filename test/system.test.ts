import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('system endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /health reports ok', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' });
  });

  it('GET /version reports a semver build and the environment', async () => {
    const { body } = await request(app.getHttpServer()).get('/version').expect(200);
    expect(body.version).toMatch(/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?\+\w+$/);
    expect(body).toMatchObject({ environment: 'local', commit: expect.any(String) });
  });
});
