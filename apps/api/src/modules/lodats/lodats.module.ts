import { Module } from '@nestjs/common';
import { LotSharesModule } from '../lot-shares/lot-shares.module';
import { PublicContentModule } from '../public-content/public-content.module';
import { LodatsController } from './lodats.controller';
import { LodatsService } from './lodats.service';

@Module({
  imports: [LotSharesModule, PublicContentModule],
  controllers: [LodatsController],
  providers: [LodatsService],
  exports: [LodatsService],
})
export class LodatsModule {}
