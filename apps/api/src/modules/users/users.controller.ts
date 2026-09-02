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
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { CreateHotlineDto } from './dto/create-hotline.dto';
import { UpdateHotlineDto } from './dto/update-hotline.dto';
import {
  CreateUserDto,
  ResetUserPasswordDto,
  UpdateUserDto,
} from './dto/user-admin.dto';
import { UsersService } from './users.service';

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

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Post(':id/avatar')
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  setAvatar(
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
    return this.usersService.setAvatar(id, file);
  }

  @Delete(':id/avatar')
  @Roles('ADMIN')
  removeAvatar(@Param('id') id: string) {
    return this.usersService.removeAvatar(id);
  }

  @Post(':id/reset-password')
  @Roles('ADMIN')
  resetPassword(@Param('id') id: string, @Body() dto: ResetUserPasswordDto) {
    return this.usersService.resetPassword(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.usersService.remove(id, user.id);
  }
}
