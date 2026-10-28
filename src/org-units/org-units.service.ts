import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/database.module';
import { orgUnits, type OrgUnit } from '../db/schema';
import type { CreateOrgUnitDto, OrgUnitDto } from './org-unit.dto';

const toDto = (row: OrgUnit): OrgUnitDto => ({ ...row, createdAt: row.createdAt.toISOString() });

@Injectable()
export class OrgUnitsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(): Promise<OrgUnitDto[]> {
    const rows = await this.db.select().from(orgUnits).orderBy(asc(orgUnits.name));
    return rows.map(toDto);
  }

  async create(input: CreateOrgUnitDto): Promise<OrgUnitDto> {
    const name = typeof input?.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 100) {
      throw new BadRequestException('name is required (1-100 characters)');
    }
    const parentId = input.parentId ?? null;
    if (parentId !== null) {
      const parent = await this.db.select().from(orgUnits).where(eq(orgUnits.id, parentId));
      if (parent.length === 0) throw new BadRequestException('parentId does not exist');
    }
    const [row] = await this.db.insert(orgUnits).values({ name, parentId }).returning();
    return toDto(row);
  }
}
