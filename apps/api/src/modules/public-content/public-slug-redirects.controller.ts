import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PublicContentService } from './public-content.service';

@Controller('public/slug-redirects')
export class PublicSlugRedirectsController {
  constructor(private readonly publicContent: PublicContentService) {}

  @Public()
  @Get(':fromSlug')
  async getByFromSlug(@Param('fromSlug') fromSlug: string) {
    const item = await this.publicContent.findLotSlugRedirect(fromSlug);
    if (!item) throw new NotFoundException('Slug redirect not found');
    return item;
  }
}
