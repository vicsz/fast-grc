import { Body, Controller, Get, Post } from '@nestjs/common';
import type { CreateOrgUnitDto, OrgUnitDto } from './org-unit.dto';
import { OrgUnitsService } from './org-units.service';

@Controller('api/org-units')
export class OrgUnitsController {
  constructor(private readonly orgUnits: OrgUnitsService) {}

  @Get()
  list(): Promise<OrgUnitDto[]> {
    return this.orgUnits.list();
  }

  @Post()
  create(@Body() body: CreateOrgUnitDto): Promise<OrgUnitDto> {
    return this.orgUnits.create(body);
  }
}
