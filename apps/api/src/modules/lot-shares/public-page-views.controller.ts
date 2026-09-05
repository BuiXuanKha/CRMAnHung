import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PUBLIC_SHARE_COOKIE } from '@crmanhung/shared';
import { Public } from '../../common/decorators/public.decorator';
import { RecordPublicPageViewDto } from './dto/record-public-page-view.dto';
import { LotSharesService } from './lot-shares.service';

@Controller('public/page-views')
export class PublicPageViewsController {
  constructor(private readonly lotShares: LotSharesService) {}

  @Public()
  @Post()
  record(
    @Req() req: Request,
    @Body() body?: RecordPublicPageViewDto,
    @Headers('authorization') authorization?: string,
  ) {
    const hasBearerToken = Boolean(authorization?.toLowerCase().startsWith('bearer '));
    const shareCookieRaw = readShareCookie(req);
    return this.lotShares.recordPublicPageView(
      body?.shareCode,
      shareCookieRaw,
      hasBearerToken,
    );
  }
}

function readShareCookie(req: Request): string | undefined {
  const raw = req.cookies?.[PUBLIC_SHARE_COOKIE];
  return typeof raw === 'string' ? raw : undefined;
}
