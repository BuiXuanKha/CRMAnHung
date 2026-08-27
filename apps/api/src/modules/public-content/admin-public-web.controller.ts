import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('media')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadMedia(
    @UploadedFile()
    file?: { buffer: Buffer; mimetype: string; originalname?: string },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Thiếu file ảnh.');
    }
    return this.publicContent.uploadPublicMedia(file);
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
