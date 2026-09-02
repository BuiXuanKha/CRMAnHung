import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LotSharesService } from './lot-shares.service';

@Controller('admin/lot-shares')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminLotSharesController {
  constructor(private readonly lotShares: LotSharesService) {}

  @Get('employee-stats')
  listEmployeeStats() {
    return this.lotShares.listEmployeeShareStats();
  }
}
