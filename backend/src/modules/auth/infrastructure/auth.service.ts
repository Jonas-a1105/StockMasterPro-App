import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthPrismaService } from '@shared/infrastructure/prisma/auth-prisma.service';
import type { AuthRepository } from '../application/ports/auth.repository.interface';
import { RegisterTenant } from '../application/use-cases/register-tenant.use-case';
import { ValidateUser } from '../application/use-cases/validate-user.use-case';

const MAX_REFRESH_TOKENS_PER_USER = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly jwtService: JwtService,
    @Inject('AuthRepository')
    private readonly authRepo: AuthRepository,
  ) {}

  async register(dto: {
    tenantName: string;
    email: string;
    password: string;
    name: string;
    deviceId?: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const existingUser = await this.authRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const useCase = new RegisterTenant(this.authRepo);
    const { tenant, user } = await useCase.execute(
      dto.tenantName,
      dto.email,
      passwordHash,
      dto.name,
    );

    const isPlatformAdmin = user.isPlatformAdmin || false;
    const accessToken = this.jwtService.sign({
      uid: user.id,
      tenant_id: tenant.id,
      role: user.role,
      isPlatformAdmin,
    });

    const refreshToken = await this.createRefreshToken(
      user.id,
      tenant.id,
      dto.deviceId,
      dto.userAgent,
      dto.ipAddress,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.id,
        isPlatformAdmin,
      },
    };
  }

  async login(dto: {
    email: string;
    password: string;
    deviceId?: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const validateUseCase = new ValidateUser(this.authRepo);
    const user = await validateUseCase.execute(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPlatformAdmin = user.isPlatformAdmin || false;
    const accessToken = this.jwtService.sign({
      uid: user.id,
      tenant_id: user.tenantId,
      role: user.role,
      isPlatformAdmin,
    });

    const refreshToken = await this.createRefreshToken(
      user.id,
      user.tenantId,
      dto.deviceId,
      dto.userAgent,
      dto.ipAddress,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        isPlatformAdmin,
      },
    };
  }

  async refresh(
    tokenStr: string,
    deviceId?: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const tokenHash = this.hashToken(tokenStr);
    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });

    if (!dbToken || dbToken.revokedAt || dbToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Rotate refresh token: revoke current, create new
    await this.prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.authRepo.findById(dbToken.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const accessToken = this.jwtService.sign({
      uid: user.id,
      tenant_id: user.tenantId,
      role: user.role,
      isPlatformAdmin: user.isPlatformAdmin || false,
    });

    const newRefreshToken = await this.createRefreshToken(
      user.id,
      user.tenantId,
      deviceId,
      userAgent,
      ipAddress,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(tokenStr: string) {
    const tokenHash = this.hashToken(tokenStr);
    await this.prisma.refreshToken.updateMany({
      where: { token: tokenHash },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async logoutDevice(userId: string, deviceId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, deviceId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async listSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gte: new Date() } },
      select: {
        id: true,
        deviceId: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return sessions;
  }

  async forgotPassword(email: string) {
    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      return {
        message:
          'Si el email está registrado, se enviará un enlace de restablecimiento',
      };
    }

    const resetToken = this.jwtService.sign(
      { uid: user.id, purpose: 'reset-password' },
      { expiresIn: '15m' },
    );

    // En producción, esto se enviaría por correo electrónico.
    // Para depuración local/desarrollo, lo imprimimos en el log del servidor:
    console.log(`[DEBUG] Reset token for ${email}: ${resetToken}`);

    return {
      message:
        'Si el email está registrado, se enviará un enlace de restablecimiento',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.purpose !== 'reset-password' || !payload.uid) {
        throw new UnauthorizedException('Token de restablecimiento inválido');
      }

      const user = await this.authRepo.findById(payload.uid);
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Revoke all user refresh tokens for security
      await this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return { success: true };
    } catch {
      throw new UnauthorizedException(
        'Token de restablecimiento inválido o expirado',
      );
    }
  }

  /** Clean up expired & revoked tokens older than 30 days */
  async cleanupExpiredTokens(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() }, revokedAt: { not: null } },
          { expiresAt: { lt: cutoff } },
        ],
      },
    });
    return result.count;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async createRefreshToken(
    userId: string,
    tenantId: string,
    deviceId?: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    // Enforce session limit: revoke oldest if at max
    const activeCount = await this.prisma.refreshToken.count({
      where: { userId, revokedAt: null, expiresAt: { gte: new Date() } },
    });

    if (activeCount >= MAX_REFRESH_TOKENS_PER_USER) {
      const oldest = await this.prisma.refreshToken.findFirst({
        where: { userId, revokedAt: null, expiresAt: { gte: new Date() } },
        orderBy: { createdAt: 'asc' },
      });
      if (oldest) {
        await this.prisma.refreshToken.update({
          where: { id: oldest.id },
          data: { revokedAt: new Date() },
        });
      }
    }

    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.prisma.refreshToken.create({
      data: {
        tenantId,
        userId,
        token: tokenHash,
        deviceId,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    return rawToken;
  }
}
