import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AddressesService } from './addresses.service';
import {
  CreateAddressDto,
  ListAddressesQueryDto,
  UpdateAddressDto,
} from './dto/address.dto';

function includeHiddenFlag(raw: string | undefined, role: string): boolean {
  if (role !== 'ADMIN') return false;
  return raw === '1' || raw === 'true';
}

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: ListAddressesQueryDto) {
    return this.addresses.list({
      keyword: query.keyword,
      kind: query.kind,
      includeHidden: includeHiddenFlag(query.includeHidden, user.role),
    });
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.addresses.getById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateAddressDto) {
    return this.addresses.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addresses.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  softHide(@Param('id') id: string) {
    return this.addresses.softHide(id);
  }

  @Get(':id/images')
  listImages(@Param('id') id: string) {
    return this.addresses.listImages(id);
  }

  @Post(':id/images')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 4 * 1024 * 1024 },
    }),
  )
  addImage(
    @Param('id') id: string,
    @UploadedFile()
    file?: { buffer: Buffer; mimetype: string; originalname?: string },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Thiếu file ảnh.');
    }
    const mime = String(file.mimetype || '');
    if (!mime.startsWith('image/')) {
      throw new BadRequestException('Chỉ nhận file ảnh.');
    }
    return this.addresses.addImage(id, file);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.addresses.deleteImage(id, imageId);
  }
}
