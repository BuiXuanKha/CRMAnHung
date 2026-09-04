import { Body, Controller, Get, Post, HttpCode, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  clearRefreshCookie,
  resolveRefreshToken,
  setRefreshCookie,
} from './auth-cookies';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    setRefreshCookie(res, result.refreshToken, this.config);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = resolveRefreshToken(req, dto.refreshToken);
    const result = await this.authService.refresh(refreshToken ?? '');
    setRefreshCookie(res, result.refreshToken, this.config);
    return result;
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = resolveRefreshToken(req, dto.refreshToken);
    const result = await this.authService.logout(refreshToken);
    clearRefreshCookie(res, this.config);
    return result;
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.id);
  }
}
