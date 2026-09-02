import { Body, Controller, Headers, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { RecordPublicPageViewDto } from './dto/record-public-page-view.dto';
import { LotSharesService } from './lot-shares.service';

@Controller('public/page-views')
export class PublicPageViewsController {
  constructor(private readonly lotShares: LotSharesService) {}

  @Public()
  @Post()
  record(
    @Body() body?: RecordPublicPageViewDto,
    @Headers('authorization') authorization?: string,
  ) {
    const hasBearerToken = Boolean(authorization?.toLowerCase().startsWith('bearer '));
    return this.lotShares.recordPublicPageView(body?.shareCode, hasBearerToken);
  }
}
