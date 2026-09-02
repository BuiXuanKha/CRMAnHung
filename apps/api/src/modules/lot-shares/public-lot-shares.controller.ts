import { Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { LotSharesService } from './lot-shares.service';

@Controller('public/lot-shares')
export class PublicLotSharesController {
  constructor(private readonly lotShares: LotSharesService) {}

  @Public()
  @Get(':code')
  resolve(@Param('code') code: string) {
    return this.lotShares.resolveShareCode(code);
  }

  @Public()
  @Post(':code/visit')
  recordVisit(@Param('code') code: string) {
    return this.lotShares.recordVisit(code);
  }

  @Public()
  @Post(':code/page-view')
  recordPageView(
    @Param('code') code: string,
    @Headers('authorization') authorization?: string,
  ) {
    const hasBearerToken = Boolean(authorization?.toLowerCase().startsWith('bearer '));
    return this.lotShares.recordAttributedPageView(code, hasBearerToken);
  }
}
