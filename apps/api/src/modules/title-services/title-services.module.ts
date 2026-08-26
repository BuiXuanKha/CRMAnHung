import { Module } from '@nestjs/common';
import { TitleServicesController } from './title-services.controller';
import { TitleServicesService } from './title-services.service';

@Module({
  controllers: [TitleServicesController],
  providers: [TitleServicesService],
})
export class TitleServicesModule {}
