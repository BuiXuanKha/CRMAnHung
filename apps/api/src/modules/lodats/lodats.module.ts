import { Module } from '@nestjs/common';
import { PublicContentModule } from '../public-content/public-content.module';
import { LodatsController } from './lodats.controller';
import { LodatsService } from './lodats.service';

@Module({
  imports: [PublicContentModule],
  controllers: [LodatsController],
  providers: [LodatsService],
  exports: [LodatsService],
})
export class LodatsModule {}
