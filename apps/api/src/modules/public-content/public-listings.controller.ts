import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PublicContentService } from './public-content.service';

@Controller('public/listings')
export class PublicListingsController {
  constructor(private readonly publicContent: PublicContentService) {}

  @Public()
  @Get()
  list() {
    return this.publicContent.listPublished();
  }

  @Public()
  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.publicContent.getPublishedBySlug(slug);
  }
}
