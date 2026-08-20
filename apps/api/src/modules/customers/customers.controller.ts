import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateCustomerCareDto } from './dto/update-customer-care.dto';
import { AddCustomerPhoneDto } from './dto/add-customer-phone.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: ListCustomersQueryDto) {
    return this.customersService.list(user, query);
  }

  @Get(':id/messages')
  listMessages(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.customersService.listMessages(user, id);
  }

  @Get(':id')
  getById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.customersService.getById(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user, id, dto);
  }

  @Post()
  create() {
    return this.customersService.createNotReady();
  }

  @Post(':id/care-notes')
  addCare(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerCareDto,
  ) {
    return this.customersService.addCare(user, id, dto);
  }

  @Post(':id/phones')
  addPhone(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AddCustomerPhoneDto,
  ) {
    return this.customersService.addPhone(user, id, dto);
  }
}
