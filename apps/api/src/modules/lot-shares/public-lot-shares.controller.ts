import { Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PUBLIC_SHARE_COOKIE } from '@crmanhung/shared';
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
    @Req() req: Request,
    @Param('code') code: string,
    @Headers('authorization') authorization?: string,
  ) {
    const hasBearerToken = Boolean(authorization?.toLowerCase().startsWith('bearer '));
    const raw = req.cookies?.[PUBLIC_SHARE_COOKIE];
    const shareCookieRaw = typeof raw === 'string' ? raw : undefined;
    return this.lotShares.recordAttributedPageView(code, shareCookieRaw, hasBearerToken);
  }
}
