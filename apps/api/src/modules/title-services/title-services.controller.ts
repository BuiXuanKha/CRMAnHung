import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
  CreateTitleServiceDto,
  ListTitleServicesQueryDto,
  PinTitleServiceDto,
  UpdateTitleServiceDto,
  AddTitleServiceProgressDto,
  AddTitleServiceMoneyDto,
  AddTitleServiceAttachmentDto,
} from './dto/title-service.dto';
import { TitleServicesService } from './title-services.service';
import { TITLE_FILE_MAX_BYTES } from './title-services-view';

@Controller('title-services')
export class TitleServicesController {
  constructor(private readonly titleServices: TitleServicesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: ListTitleServicesQueryDto) {
    return this.titleServices.list(user, query);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateTitleServiceDto) {
    return this.titleServices.create(user, dto);
  }

  @Get(':id')
  getById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.titleServices.getById(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateTitleServiceDto,
  ) {
    return this.titleServices.update(user, id, dto);
  }

  @Patch(':id/pin')
  pin(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: PinTitleServiceDto,
  ) {
    return this.titleServices.pin(user, id, dto);
  }

  @Post(':id/progress')
  addProgress(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AddTitleServiceProgressDto,
  ) {
    return this.titleServices.addProgress(user, id, dto);
  }

  @Delete(':id/progress/:progressId')
  @HttpCode(204)
  removeProgress(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('progressId') progressId: string,
  ) {
    return this.titleServices.removeProgress(user, id, progressId);
  }

  @Post(':id/money')
  addMoney(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AddTitleServiceMoneyDto,
  ) {
    return this.titleServices.addMoney(user, id, dto);
  }

  @Delete(':id/money/:moneyId')
  @HttpCode(204)
  removeMoney(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('moneyId') moneyId: string,
  ) {
    return this.titleServices.removeMoney(user, id, moneyId);
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: TITLE_FILE_MAX_BYTES },
    }),
  )
  addAttachment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AddTitleServiceAttachmentDto,
    @UploadedFile()
    file?: { buffer: Buffer; mimetype: string; originalname?: string },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Thiếu file tài liệu.');
    }
    return this.titleServices.addAttachment(user, id, dto, file);
  }

  @Get(':id/attachments/:attachmentId/url')
  attachmentSignedUrl(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.titleServices.attachmentSignedUrl(user, id, attachmentId);
  }

  @Delete(':id/attachments/:attachmentId')
  @HttpCode(204)
  removeAttachment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.titleServices.removeAttachment(user, id, attachmentId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.titleServices.remove(user, id);
  }
}
