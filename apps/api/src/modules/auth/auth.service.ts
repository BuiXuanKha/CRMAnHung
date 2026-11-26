import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
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

/** Losing tab of a same-cookie refresh. Session stays; do not clear the new cookie. */
export const REFRESH_SUPERSEDED_CODE = 'REFRESH_SUPERSEDED';

const REFRESH_REUSE_GRACE_MS = 15_000;

export class RefreshSupersededException extends UnauthorizedException {
  constructor() {
    super({
      statusCode: 401,
      message: 'Refresh token không hợp lệ hoặc đã hết hạn',
      code: REFRESH_SUPERSEDED_CODE,
    });
  }
}

export function isRefreshSuperseded(err: unknown): boolean {
  return err instanceof RefreshSupersededException;
}

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

    // Lock the row so two tabs cannot both rotate the same cookie (BUG-089).
    // The loser runs only after the winner has committed the replacement token.
    const outcome = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "RefreshToken" WHERE "tokenHash" = ${tokenHash} FOR UPDATE
      `;
      if (locked.length === 0) {
        return { kind: 'invalid' as const };
      }
      const stored = await tx.refreshToken.findUnique({
        where: { id: locked[0]!.id },
        include: { user: true },
      });
      if (!stored) {
        return { kind: 'invalid' as const };
      }
      if (stored.revokedAt) {
        return {
          kind: 'reused' as const,
          userId: stored.userId,
          revokedAt: stored.revokedAt,
        };
      }
      if (stored.expiresAt < new Date()) {
        return { kind: 'invalid' as const };
      }
      if (!stored.user.isActive) {
        return { kind: 'inactive' as const };
      }

      await tx.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
      const payload = toAuthUser(stored.user, this.storage);
      const tokens = await this.issueTokens(payload, stored.user.sessionVersion, tx);
      return { kind: 'ok' as const, tokens, user: payload };
    });

    if (outcome.kind === 'inactive') {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }
    if (outcome.kind === 'reused') {
      await this.rejectReusedRefresh(outcome.userId, outcome.revokedAt);
    }
    if (outcome.kind !== 'ok') {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
    return { ...outcome.tokens, user: outcome.user };
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

  /**
   * A rotated cookie presented again. A sibling request that just issued a
   * replacement is not theft (BUG-089). Older reuse still kills every session (BUG-006).
   */
  private async rejectReusedRefresh(userId: string, revokedAt: Date): Promise<never> {
    const ageMs = Date.now() - revokedAt.getTime();
    const replaced = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        revokedAt: null,
        // App clock sets revokedAt; Postgres sets createdAt. Allow a few seconds of skew.
        createdAt: { gte: new Date(revokedAt.getTime() - 5_000) },
      },
      select: { id: true },
    });
    if (!replaced || ageMs > REFRESH_REUSE_GRACE_MS) {
      await this.revokeAllSessions(userId);
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
    throw new RefreshSupersededException();
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
    db: PrismaService | Prisma.TransactionClient = this.prisma,
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

    await db.refreshToken.create({
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
