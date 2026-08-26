import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  SetPublicLotPublishedDto,
  UpdatePublicListingDraftDto,
} from './dto/public-listing.dto';
import { PublicContentService } from './public-content.service';

@Controller('admin/public-web')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminPublicWebController {
  constructor(private readonly publicContent: PublicContentService) {}

  @Get('lots')
  listLots() {
    return this.publicContent.listAdminLots();
  }

  @Patch('lots/:id/draft')
  updateDraft(@Param('id') id: string, @Body() dto: UpdatePublicListingDraftDto) {
    return this.publicContent.updateDraft(id, dto);
  }

  @Patch('lots/:id/published')
  setPublished(@Param('id') id: string, @Body() dto: SetPublicLotPublishedDto) {
    return this.publicContent.setPublished(id, dto.isPublished);
  }
}
