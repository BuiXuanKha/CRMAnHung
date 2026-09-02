import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { LotSharesService } from '../lot-shares/lot-shares.service';
import { PublicContentService } from './public-content.service';

@Controller('public/listings')
export class PublicListingsController {
  constructor(
    private readonly publicContent: PublicContentService,
    private readonly lotShares: LotSharesService,
  ) {}

  @Public()
  @Get()
  list() {
    return this.publicContent.listPublished();
  }

  @Post(':slug/share-link')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'STAFF')
  createShareLink(@CurrentUser() user: RequestUser, @Param('slug') slug: string) {
    return this.lotShares.createOrGetShareLinkBySlug(user, slug);
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.publicContent.getPublishedBySlug(slug);
  }
}
