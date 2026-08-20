import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { CreateHotlineDto } from './dto/create-hotline.dto';
import { UpdateHotlineDto } from './dto/update-hotline.dto';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  list() {
    return this.usersService.list();
  }

  @Get('me/hotlines')
  listMyHotlines(
    @CurrentUser() user: RequestUser,
    @Query('active') active?: string,
  ) {
    const activeOnly = active === '1' || active === 'true';
    return this.usersService.listHotlines(user.id, activeOnly);
  }

  @Post('me/hotlines')
  createHotline(@CurrentUser() user: RequestUser, @Body() dto: CreateHotlineDto) {
    return this.usersService.createHotline(user.id, dto);
  }

  @Patch('me/hotlines/:id')
  updateHotline(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateHotlineDto,
  ) {
    return this.usersService.updateHotline(user.id, id, dto);
  }
}
