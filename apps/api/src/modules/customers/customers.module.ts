import { Module } from '@nestjs/common';
import { LodatsModule } from '../lodats/lodats.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [LodatsModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
