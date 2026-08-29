import { Module } from '@nestjs/common';
import { LodatsModule } from '../lodats/lodats.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { FromExtensionService } from './from-extension.service';

@Module({
  imports: [LodatsModule],
  controllers: [CustomersController],
  providers: [CustomersService, FromExtensionService],
})
export class CustomersModule {}
