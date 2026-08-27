import { Module } from '@nestjs/common';
import { AdminPublicWebController } from './admin-public-web.controller';
import { PublicContentService } from './public-content.service';
import { PublicListingsController } from './public-listings.controller';
import { PublicPostsController } from './public-posts.controller';
import { PublicSlugRedirectsController } from './public-slug-redirects.controller';
import { PublicWebRevalidateService } from './public-web-revalidate.service';

@Module({
  controllers: [
    PublicListingsController,
    PublicPostsController,
    PublicSlugRedirectsController,
    AdminPublicWebController,
  ],
  providers: [PublicContentService, PublicWebRevalidateService],
})
export class PublicContentModule {}
