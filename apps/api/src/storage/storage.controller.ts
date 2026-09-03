import { Controller, Get, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PublicImageQueryDto } from './dto/public-image-query.dto';
import { StorageService } from './storage.service';

@Controller('storage')
@UseGuards(RolesGuard)
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get('public-image')
  @Roles('ADMIN', 'STAFF')
  async downloadPublicImage(@Query() query: PublicImageQueryDto): Promise<StreamableFile> {
    const { buffer, contentType, fileName } = await this.storage.fetchPublicImage(query.url);
    return new StreamableFile(buffer, {
      type: contentType,
      disposition: `inline; filename="${fileName.replace(/"/g, '')}"`,
    });
  }
}
