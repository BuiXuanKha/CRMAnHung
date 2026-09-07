import { Module } from '@nestjs/common';
import { LotSharesModule } from '../lot-shares/lot-shares.module';
import { PublicWebRevalidateModule } from '../public-content/public-web-revalidate.module';
import { LodatsController } from './lodats.controller';
import { LodatsService } from './lodats.service';

@Module({
  imports: [LotSharesModule, PublicWebRevalidateModule],
  controllers: [LodatsController],
  providers: [LodatsService],
  exports: [LodatsService],
})
export class LodatsModule {}
