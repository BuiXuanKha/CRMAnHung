import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { userAvatarUrl } from '../users/users-view';
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
  phone?: string;
  avatarUrl?: string | null;
};

type AuthUserSource = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  phone?: string | null;
  avatarObjectKey?: string | null;
  sessionVersion: number;
};

function toAuthUser(user: AuthUserSource, storage: StorageService): AuthUserPayload {
  const phone = user.phone?.trim();
  const avatarUrl = userAvatarUrl(storage, user.avatarObjectKey);
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    ...(phone ? { phone } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {}

  async login(dto: LoginDto) {
    const username = dto.username.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    // Always bcrypt.compare to avoid timing username enumeration (BUG-004).
    const dummyHash =
      '$2b$12$kK7DyCVvhSre804Vqnouset4L65ja9Ql7/Gt3ot4rDEU7Ww4L.RzK';
    const passwordHash = user?.isActive ? user.passwordHash : dummyHash;
    const ok = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !user.isActive || !ok) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const payload: AuthUserPayload = toAuthUser(user, this.storage);

    const tokens = await this.issueTokens(payload, user.sessionVersion);
    return { ...tokens, user: payload };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken?.trim()) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    // Reuse of a rotated (already revoked) refresh token → kill all sessions (BUG-006).
    if (stored.revokedAt) {
      await this.revokeAllSessions(stored.userId);
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    if (stored.expiresAt < new Date()) {
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

    const payload: AuthUserPayload = toAuthUser(stored.user, this.storage);

    const tokens = await this.issueTokens(payload, stored.user.sessionVersion);
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

  /** Revoke every refresh token and bump sessionVersion (invalidates access JWTs). */
  private async revokeAllSessions(userId: string) {
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { sessionVersion: { increment: 1 } },
      }),
    ]);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        phone: true,
        isActive: true,
        avatarObjectKey: true,
        sessionVersion: true,
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }
    return toAuthUser(user, this.storage);
  }

  private async issueTokens(
    payload: AuthUserPayload,
    sessionVersion: number,
  ): Promise<AuthTokens> {
    const accessExpiresIn =
      this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';

    const accessToken = await this.jwt.signAsync(
      {
        sub: payload.id,
        username: payload.username,
        fullName: payload.fullName,
        role: payload.role,
        sv: sessionVersion,
      },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    const expiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d';
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
