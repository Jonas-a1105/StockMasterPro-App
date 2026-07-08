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
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import type { AuthRepository } from '../application/ports/auth.repository.interface';
import { RegisterTenant } from '../application/use-cases/register-tenant.use-case';
import { ValidateUser } from '../application/use-cases/validate-user.use-case';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject('AuthRepository')
    private readonly authRepo: AuthRepository,
  ) {}

  async register(dto: {
    tenantName: string;
    email: string;
    password: string;
    name: string;
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

    const accessToken = this.jwtService.sign({
      uid: user.id,
      tenant_id: tenant.id,
      role: user.role,
    });

    const refreshToken = await this.createRefreshToken(user.id, tenant.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: tenant.id,
      },
    };
  }

  async login(dto: { email: string; password: string }) {
    const validateUseCase = new ValidateUser(this.authRepo);
    const user = await validateUseCase.execute(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = this.jwtService.sign({
      uid: user.id,
      tenant_id: user.tenantId,
      role: user.role,
    });

    const refreshToken = await this.createRefreshToken(user.id, user.tenantId);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async refresh(tokenStr: string) {
    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { token: tokenStr },
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
    });

    const newRefreshToken = await this.createRefreshToken(user.id, user.tenantId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(tokenStr: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: tokenStr },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      // Return generic success for security (don't leak registered emails)
      return { message: 'Si el email está registrado, se enviará un enlace de restablecimiento' };
    }

    // Generate a stateless password reset token with 15-minute expiry
    const resetToken = this.jwtService.sign(
      { uid: user.id, purpose: 'reset-password' },
      { expiresIn: '15m' },
    );

    // In production we would email this. For development/audit, we return it.
    return {
      message: 'Si el email está registrado, se enviará un enlace de restablecimiento',
      resetToken, // Returned for dev mode / testing convenience
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

      // Update password using Prisma directly
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
    } catch (err) {
      throw new UnauthorizedException('Token de restablecimiento inválido o expirado');
    }
  }

  private async createRefreshToken(userId: string, tenantId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    await this.prisma.refreshToken.create({
      data: {
        tenantId,
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }
}

