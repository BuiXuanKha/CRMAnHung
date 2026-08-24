import { Module } from '@nestjs/common';
import { LodatsController } from './lodats.controller';
import { LodatsService } from './lodats.service';

@Module({
  controllers: [LodatsController],
  providers: [LodatsService],
})
export class LodatsModule {}
