import { Module } from '@nestjs/common';
import { PublicWebRevalidateModule } from '../public-content/public-web-revalidate.module';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { AdminUnitsController } from './admin-units.controller';
import { AdminUnitsService } from './admin-units.service';

@Module({
  imports: [PublicWebRevalidateModule],
  controllers: [AddressesController, AdminUnitsController],
  providers: [AddressesService, AdminUnitsService],
  exports: [AddressesService, AdminUnitsService],
})
export class AddressesModule {}
