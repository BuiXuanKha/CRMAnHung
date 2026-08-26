import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import {
  CreateTitleServiceDto,
  ListTitleServicesQueryDto,
  PinTitleServiceDto,
  UpdateTitleServiceDto,
} from './dto/title-service.dto';
import { TitleServicesService } from './title-services.service';

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

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.titleServices.remove(user, id);
  }
}
