import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateCustomerCareDto } from './dto/update-customer-care.dto';
import { AddCustomerPhoneDto } from './dto/add-customer-phone.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { AcknowledgePhoneDuplicateDto } from './dto/acknowledge-phone-duplicate.dto';
import { MergeFacebookDto } from './dto/merge-facebook.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: ListCustomersQueryDto) {
    return this.customersService.list(user, query);
  }

  @Get('contact-channels')
  listChannels(@CurrentUser() user: RequestUser) {
    return this.customersService.listChannels(user);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user, dto);
  }

  @Post('from-extension')
  fromExtension(@CurrentUser() user: RequestUser, @Body() body: Record<string, unknown>) {
    return this.customersService.fromExtensionIngest(user, body);
  }

  @Post('merge-facebook-into-phone-holder')
  mergeFacebook(@CurrentUser() user: RequestUser, @Body() dto: MergeFacebookDto) {
    return this.customersService.mergeFacebook(user, dto);
  }

  @Get(':id/messages')
  listMessages(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.customersService.listMessages(user, id);
  }

  @Get(':id/lodats')
  listLodats(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.customersService.listLodats(user, id);
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

  @Patch(':id/acknowledge-phone-duplicate')
  acknowledgeDuplicate(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AcknowledgePhoneDuplicateDto,
  ) {
    return this.customersService.acknowledgeDuplicate(user, id, dto);
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

  @Patch(':id/phones/:phoneId')
  updatePhone(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('phoneId') phoneId: string,
    @Body() dto: AddCustomerPhoneDto,
  ) {
    return this.customersService.updatePhone(user, id, phoneId, dto);
  }

  @Delete(':id/phones/:phoneId')
  deletePhone(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('phoneId') phoneId: string,
  ) {
    return this.customersService.deletePhone(user, id, phoneId);
  }
}
