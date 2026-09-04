import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminUnitsService } from './admin-units.service';
import { CreateAdminUnitDto, ListAdminUnitsQueryDto } from './dto/admin-units.dto';

function includeHiddenFlag(raw: string | undefined, role: string): boolean {
  if (role !== 'ADMIN') return false;
  return raw === '1' || raw === 'true';
}

@Controller('admin-units')
export class AdminUnitsController {
  constructor(private readonly adminUnits: AdminUnitsService) {}

  @Get('provinces')
  listProvinces(
    @CurrentUser() user: RequestUser,
    @Query() query: ListAdminUnitsQueryDto,
  ) {
    return this.adminUnits.listProvinces(
      includeHiddenFlag(query.includeHidden, user.role),
    );
  }

  @Post('provinces')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  createProvince(@CurrentUser() user: RequestUser, @Body() dto: CreateAdminUnitDto) {
    return this.adminUnits.createProvince(user.id, dto);
  }

  @Get('districts')
  listDistricts(
    @CurrentUser() user: RequestUser,
    @Query() query: ListAdminUnitsQueryDto,
  ) {
    return this.adminUnits.listDistricts(
      String(query.parentId || ''),
      includeHiddenFlag(query.includeHidden, user.role),
    );
  }

  @Post('districts')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  createDistrict(@CurrentUser() user: RequestUser, @Body() dto: CreateAdminUnitDto) {
    return this.adminUnits.createDistrict(user.id, dto);
  }

  @Get('wards')
  listWards(
    @CurrentUser() user: RequestUser,
    @Query() query: ListAdminUnitsQueryDto,
  ) {
    return this.adminUnits.listWards(
      String(query.parentId || ''),
      includeHiddenFlag(query.includeHidden, user.role),
    );
  }

  @Post('wards')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  createWard(@CurrentUser() user: RequestUser, @Body() dto: CreateAdminUnitDto) {
    return this.adminUnits.createWard(user.id, dto);
  }
}
