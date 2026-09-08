import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import { CreateWorkTaskDto } from './dto/task.dto';
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
}
