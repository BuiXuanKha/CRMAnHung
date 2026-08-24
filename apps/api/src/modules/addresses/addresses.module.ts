import { Module } from '@nestjs/common';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { AdminUnitsController } from './admin-units.controller';
import { AdminUnitsService } from './admin-units.service';

@Module({
  controllers: [AddressesController, AdminUnitsController],
  providers: [AddressesService, AdminUnitsService],
  exports: [AddressesService, AdminUnitsService],
})
export class AddressesModule {}
