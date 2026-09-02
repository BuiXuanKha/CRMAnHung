import { Module } from '@nestjs/common';
import { LotSharesModule } from '../lot-shares/lot-shares.module';
import { AdminPublicWebController } from './admin-public-web.controller';
import { PublicContentService } from './public-content.service';
import { PublicListingHubsController } from './public-listing-hubs.controller';
import { PublicListingsController } from './public-listings.controller';
import { PublicPostsController } from './public-posts.controller';
import { PublicSlugRedirectsController } from './public-slug-redirects.controller';
import { PublicWebRevalidateService } from './public-web-revalidate.service';
import { LotGptService } from './lot-gpt.service';
import { PostGptService } from './post-gpt.service';

@Module({
  imports: [LotSharesModule],
  controllers: [
    PublicListingHubsController,
    PublicListingsController,
    PublicPostsController,
    PublicSlugRedirectsController,
    AdminPublicWebController,
  ],
  providers: [
    PublicContentService,
    PublicWebRevalidateService,
    LotGptService,
    PostGptService,
  ],
})
export class PublicContentModule {}
