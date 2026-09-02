import { Module } from '@nestjs/common';
import { LotSharesService } from './lot-shares.service';
import { PublicLotSharesController } from './public-lot-shares.controller';
import { PublicPageViewsController } from './public-page-views.controller';
import { AdminLotSharesController } from './admin-lot-shares.controller';

@Module({
  controllers: [
    PublicPageViewsController,
    PublicLotSharesController,
    AdminLotSharesController,
  ],
  providers: [LotSharesService],
  exports: [LotSharesService],
})
export class LotSharesModule {}
