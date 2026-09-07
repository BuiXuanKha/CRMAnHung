import { Module } from '@nestjs/common';
import { PublicWebRevalidateService } from './public-web-revalidate.service';

@Module({
  providers: [PublicWebRevalidateService],
  exports: [PublicWebRevalidateService],
})
export class PublicWebRevalidateModule {}
