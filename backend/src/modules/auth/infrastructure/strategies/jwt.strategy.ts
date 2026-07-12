import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { withTenant } from '@shared/infrastructure/prisma/rls-helper';
import type { User as PrismaUser } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: {
    uid: string;
    tenant_id: string;
    role: string;
    isPlatformAdmin?: boolean;
  }) {
    const user = await withTenant<PrismaUser | null>(
      this.prisma,
      payload.tenant_id,
      (tx) =>
        tx.user.findUnique({
          where: { id: payload.uid },
        }),
    );
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      isPlatformAdmin: payload.isPlatformAdmin || false,
    };
  }
}
