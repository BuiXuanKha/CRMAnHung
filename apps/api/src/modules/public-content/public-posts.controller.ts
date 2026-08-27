import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PublicContentService } from './public-content.service';

@Controller('public/posts')
export class PublicPostsController {
  constructor(private readonly publicContent: PublicContentService) {}

  @Public()
  @Get()
  list(@Query('category') category?: string) {
    return this.publicContent.listPublishedPosts(category?.trim() || undefined);
  }

  @Public()
  @Get(':category/:slug')
  getByCategorySlug(
    @Param('category') category: string,
    @Param('slug') slug: string,
  ) {
    return this.publicContent.getPublishedPost(category, slug);
  }
}
