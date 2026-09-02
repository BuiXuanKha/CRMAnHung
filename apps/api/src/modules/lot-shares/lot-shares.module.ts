import { Module } from '@nestjs/common';
import { LotSharesService } from './lot-shares.service';
import { PublicLotSharesController } from './public-lot-shares.controller';

@Module({
  controllers: [PublicLotSharesController],
  providers: [LotSharesService],
  exports: [LotSharesService],
})
export class LotSharesModule {}
