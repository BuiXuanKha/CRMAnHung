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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import {
  CreateLodatDto,
  ListLodatsQueryDto,
  ListProjectLotsQueryDto,
  UpdateLodatDto,
  UpdateLodatImageRotationDto,
  UpdateLodatSaleStatusDto,
  ChangeLodatOwnerDto,
  UploadLodatTempImageDto,
} from './dto/lodat.dto';
import { LodatsService } from './lodats.service';
import { LotSharesService } from '../lot-shares/lot-shares.service';

@Controller('lodats')
export class LodatsController {
  constructor(
    private readonly lodats: LodatsService,
    private readonly lotShares: LotSharesService,
  ) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: ListLodatsQueryDto) {
    return this.lodats.list(user, query);
  }

  /** Kho lô theo địa chỉ dự án — phải đứng trước các route `:id`. */
  @Get('project-lots')
  listProjectLots(
    @CurrentUser() user: RequestUser,
    @Query() query: ListProjectLotsQueryDto,
  ) {
    return this.lodats.listProjectLots(user, query.addressId);
  }

  /** Ảnh tạm form tạo lô — phải đứng trước `:id`. */
  @Post('temp-images')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 4 * 1024 * 1024 },
    }),
  )
  uploadTempImage(
    @CurrentUser() user: RequestUser,
    @Body() dto: UploadLodatTempImageDto,
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
    return this.lodats.uploadTempImage(user, dto.sessionId, file);
  }

  @Delete('temp-images/:tempImageId')
  deleteTempImage(
    @CurrentUser() user: RequestUser,
    @Param('tempImageId') tempImageId: string,
  ) {
    return this.lodats.deleteTempImage(user, tempImageId);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateLodatDto) {
    return this.lodats.create(user, dto);
  }

  @Get(':id/same-ward')
  listSameWard(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lodats.listSameWard(user, id);
  }

  @Post(':id/share-link')
  createShareLink(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lotShares.createOrGetShareLink(user, id);
  }

  @Get(':id')
  getById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lodats.getById(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateLodatDto,
  ) {
    return this.lodats.update(user, id, dto);
  }

  @Patch(':id/sale-status')
  updateSaleStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateLodatSaleStatusDto,
  ) {
    return this.lodats.updateSaleStatus(user, id, dto);
  }

  @Post(':id/change-owner')
  changeOwner(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ChangeLodatOwnerDto,
  ) {
    return this.lodats.changeOwner(user, id, dto);
  }

  @Patch(':id/images/:imageId/rotation')
  updateImageRotation(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Body() dto: UpdateLodatImageRotationDto,
  ) {
    return this.lodats.updateImageRotation(user, id, imageId, dto);
  }

  @Post(':id/images')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 4 * 1024 * 1024 },
    }),
  )
  addImage(
    @CurrentUser() user: RequestUser,
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
    return this.lodats.addImage(user, id, file);
  }

  @Delete(':id/images/:imageId')
  deleteImage(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.lodats.deleteImage(user, id, imageId);
  }
}
