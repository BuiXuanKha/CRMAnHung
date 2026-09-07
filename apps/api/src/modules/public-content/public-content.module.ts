import { Module } from '@nestjs/common';
import { LotSharesModule } from '../lot-shares/lot-shares.module';
import { AdminPublicWebController } from './admin-public-web.controller';
import { PublicContentService } from './public-content.service';
import { PublicCommuneHubsService } from './public-commune-hubs';
import { PublicListingHubsController } from './public-listing-hubs.controller';
import { PublicListingsController } from './public-listings.controller';
import { PublicPostsController } from './public-posts.controller';
import { PublicSlugRedirectsController } from './public-slug-redirects.controller';
import { PublicWebRevalidateModule } from './public-web-revalidate.module';
import { LotGptService } from './lot-gpt.service';
import { PostGptService } from './post-gpt.service';

@Module({
  imports: [LotSharesModule, PublicWebRevalidateModule],
  controllers: [
    PublicListingHubsController,
    PublicListingsController,
    PublicPostsController,
    PublicSlugRedirectsController,
    AdminPublicWebController,
  ],
  providers: [
    PublicContentService,
    PublicCommuneHubsService,
    LotGptService,
    PostGptService,
  ],
})
export class PublicContentModule {}
