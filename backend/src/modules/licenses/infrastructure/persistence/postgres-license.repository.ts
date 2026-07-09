import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class PostgresLicenseRepo {
  constructor(private readonly prisma: PrismaService) {}

  async findTenantById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async updateLicense(
    tenantId: string,
    expiresAt: Date,
    tier: string,
  ): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planType: tier,
        subscriptionStatus: 'active',
        isBlocked: false,
        licenseExpiresAt: expiresAt,
      },
    });
  }

  async markAsBlocked(tenantId: string): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isBlocked: true },
    });
  }

  async markAsCanceled(tenantId: string): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { subscriptionStatus: 'canceled', isBlocked: true },
    });
  }

  async markAsActive(tenantId: string): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { subscriptionStatus: 'active', isBlocked: false },
    });
  }

  async updatePlan(
    tenantId: string,
    planType: string,
  ): Promise<{ message: string; planType: string }> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { planType },
    });
    return { message: `Plan actualizado a ${planType}`, planType };
  }
}
