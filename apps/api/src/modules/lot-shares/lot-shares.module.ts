import { Module } from '@nestjs/common';
import { LotSharesService } from './lot-shares.service';
import { PublicLotSharesController } from './public-lot-shares.controller';
import { AdminLotSharesController } from './admin-lot-shares.controller';

@Module({
  controllers: [PublicLotSharesController, AdminLotSharesController],
  providers: [LotSharesService],
  exports: [LotSharesService],
})
export class LotSharesModule {}
