import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import {
  ListLodatsQueryDto,
  UpdateLodatImageRotationDto,
  UpdateLodatSaleStatusDto,
} from './dto/lodat.dto';
import { LodatsService } from './lodats.service';

@Controller('lodats')
export class LodatsController {
  constructor(private readonly lodats: LodatsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: ListLodatsQueryDto) {
    return this.lodats.list(user, query);
  }

  @Get(':id/same-ward')
  listSameWard(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lodats.listSameWard(user, id);
  }

  @Get(':id')
  getById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.lodats.getById(user, id);
  }

  @Patch(':id/sale-status')
  updateSaleStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateLodatSaleStatusDto,
  ) {
    return this.lodats.updateSaleStatus(user, id, dto);
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
}
