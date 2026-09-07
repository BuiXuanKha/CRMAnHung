import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PublicContentService } from './public-content.service';

@Controller('public/listing-hubs')
export class PublicListingHubsController {
  constructor(private readonly publicContent: PublicContentService) {}

  @Public()
  @Get('commune-redirects/:fromSlug')
  async getCommuneRedirect(@Param('fromSlug') fromSlug: string) {
    const item = await this.publicContent.findCommuneHubRedirect(fromSlug);
    if (!item) throw new NotFoundException('Không tìm thấy khu vực');
    return item;
  }

  @Public()
  @Get('communes')
  listCommunes() {
    return this.publicContent.listCommuneHubs();
  }

  @Public()
  @Get('communes/:slug')
  getCommune(@Param('slug') slug: string) {
    return this.publicContent.getCommuneHubDetail(slug);
  }

  @Public()
  @Get('places')
  listPlaces(@Query('commune') commune?: string) {
    return this.publicContent.listPlaceHubs(commune?.trim() || undefined);
  }

  @Public()
  @Get('communes/:commune/places/:place')
  getPlace(@Param('commune') commune: string, @Param('place') place: string) {
    return this.publicContent.getPlaceHubDetail(commune, place);
  }
}
