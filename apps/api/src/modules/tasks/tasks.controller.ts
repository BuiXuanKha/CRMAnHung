import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import { CreateWorkTaskDto, PinWorkTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.tasks.list(user);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateWorkTaskDto) {
    return this.tasks.create(user, dto);
  }

  @Patch(':id/pin')
  pin(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: PinWorkTaskDto,
  ) {
    return this.tasks.pin(user, id, dto);
  }

  @Patch(':id/complete')
  complete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.tasks.complete(user, id);
  }
}
