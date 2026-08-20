import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/auth.dto';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUserPayload = {
  id: string;
  username: string;
  fullName: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { username: { equals: dto.username.trim(), mode: 'insensitive' } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const payload: AuthUserPayload = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    };

    const tokens = await this.issueTokens(payload);
    return { ...tokens, user: payload };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // Rotation: revoke old token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const payload: AuthUserPayload = {
      id: stored.user.id,
      username: stored.user.username,
      fullName: stored.user.fullName,
      role: stored.user.role,
    };

    const tokens = await this.issueTokens(payload);
    return { ...tokens, user: payload };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return { ok: true };
    }
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    };
  }

  private async issueTokens(payload: AuthUserPayload): Promise<AuthTokens> {
    const accessExpiresIn =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';

    const accessToken = await this.jwt.signAsync(
      {
        sub: payload.id,
        username: payload.username,
        fullName: payload.fullName,
        role: payload.role,
      },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    const expiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const expiresAt = this.parseExpiryDate(expiresIn);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId: payload.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiryDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const value = Number(match[1]);
    const unit = match[2];
    const mult =
      unit === 's'
        ? 1000
        : unit === 'm'
          ? 60_000
          : unit === 'h'
            ? 3_600_000
            : 86_400_000;
    return new Date(Date.now() + value * mult);
  }
}
