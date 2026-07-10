import { Injectable } from '@nestjs/common';
import { AuthPrismaService } from '@shared/infrastructure/prisma/auth-prisma.service';
import { AuthRepository } from '../../application/ports/auth.repository.interface';
import { User } from '../../domain/user.entity';
import { Tenant } from '../../domain/tenant.entity';
import { User as PrismaUser, Tenant as PrismaTenant } from '@prisma/client';

@Injectable()
export class PostgresAuthRepo implements AuthRepository {
  constructor(private readonly prisma: AuthPrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return this.toUser(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return this.toUser(user);
  }

  async createTenant(data: {
    name: string;
    licenseExpiresAt: Date;
  }): Promise<Tenant> {
    const tenant = await this.prisma.tenant.create({ data });
    return new Tenant(
      tenant.id,
      tenant.name,
      tenant.planType,
      tenant.subscriptionStatus,
      tenant.licenseExpiresAt,
      tenant.isBlocked,
    );
  }

  async createUser(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
  }): Promise<User> {
    const user = await this.prisma.user.create({ data });
    return this.toUser(user);
  }

  async findTenantById(id: string): Promise<Tenant | null> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return null;
    return new Tenant(
      tenant.id,
      tenant.name,
      tenant.planType,
      tenant.subscriptionStatus,
      tenant.licenseExpiresAt,
      tenant.isBlocked,
    );
  }

  private toUser(u: PrismaUser): User {
    return new User(
      u.id,
      u.tenantId,
      u.email,
      u.passwordHash,
      u.name,
      u.role,
      u.isActive,
      u.isPlatformAdmin || false,
    );
  }
}
