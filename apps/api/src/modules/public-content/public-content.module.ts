import { Module } from '@nestjs/common';
import { AdminPublicWebController } from './admin-public-web.controller';
import { PublicContentService } from './public-content.service';
import { PublicListingsController } from './public-listings.controller';

@Module({
  controllers: [PublicListingsController, AdminPublicWebController],
  providers: [PublicContentService],
})
export class PublicContentModule {}
