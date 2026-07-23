import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      ok: true,
      service: 'crmanhung-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }
}
