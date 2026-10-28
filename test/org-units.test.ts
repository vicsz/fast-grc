import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { OrgUnitDto } from '../src/org-units/org-unit.dto';

describe('org units API', () => {
  let app: INestApplication;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('lists the seeded hierarchy', async () => {
    const { body } = await api().get('/api/org-units').expect(200);
    const units = body as OrgUnitDto[];
    const root = units.find((u) => u.name === 'Northwind Financial');
    expect(root?.parentId).toBeNull();
    expect(units.find((u) => u.name === 'Cards')?.parentId).toBe(
      units.find((u) => u.name === 'Retail Banking')?.id,
    );
  });

  it('adds an org unit under a parent', async () => {
    const units: OrgUnitDto[] = (await api().get('/api/org-units')).body;
    const parent = units.find((u) => u.name === 'Technology')!;

    const { body } = await api()
      .post('/api/org-units')
      .send({ name: '  Cloud Platform  ', parentId: parent.id })
      .expect(201);
    expect(body).toMatchObject({ name: 'Cloud Platform', parentId: parent.id });

    const after: OrgUnitDto[] = (await api().get('/api/org-units')).body;
    expect(after).toHaveLength(units.length + 1);
  });

  it('rejects a blank name', async () => {
    await api().post('/api/org-units').send({ name: '   ' }).expect(400);
  });

  it('rejects an unknown parent', async () => {
    await api()
      .post('/api/org-units')
      .send({ name: 'Orphan', parentId: '00000000-0000-0000-0000-000000000000' })
      .expect(400);
  });
});
