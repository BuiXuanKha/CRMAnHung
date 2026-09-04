import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

type JwtPayload = {
  sub: string;
  username: string;
  fullName: string;
  role: string;
  /** Session version at issue time; must match User.sessionVersion. */
  sv?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        isActive: true,
        sessionVersion: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    const tokenVersion = payload.sv ?? 0;
    if (tokenVersion !== user.sessionVersion) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    };
  }
}
