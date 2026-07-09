import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { PostgresLicenseRepo } from './persistence/postgres-license.repository';

@Injectable()
export class LicensesService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly licenseRepo: PostgresLicenseRepo,
    private readonly prisma: PrismaService,
  ) {}

  async getStatus(tenantId: string) {
    const [tenant, raw] = await Promise.all([
      this.licenseRepo.findTenantById(tenantId),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { createdAt: true },
      }),
    ]);
    if (!tenant) throw new Error('Tenant no encontrado');
    return {
      tier: tenant.planType || 'free',
      status: tenant.subscriptionStatus || 'active',
      expiresAt: tenant.licenseExpiresAt,
      activatedAt: raw?.createdAt || null,
      isBlocked: tenant.isBlocked,
    };
  }

  async getUsageStats(tenantId: string) {
    const tenant = await this.licenseRepo.findTenantById(tenantId);
    if (!tenant) throw new Error('Tenant no encontrado');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      productCount,
      userCount,
      warehouseCount,
      customerCount,
      supplierCount,
      accountsPayableCount,
      expensesCount,
      salesThisMonth,
      storageUsage,
    ] = await Promise.all([
      this.prisma.product.count({ where: { tenantId, isActive: true } }),
      this.prisma.user.count({ where: { tenantId, isActive: true } }),
      this.prisma.warehouse.count({ where: { tenantId, isActive: true } }),
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.supplier.count({ where: { tenantId } }),
      this.prisma.accountsPayable.count({ where: { tenantId } }),
      this.prisma.expense.count({ where: { tenantId } }),
      this.prisma.sale.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
      this.getStorageEstimate(tenantId),
    ]);

    const isFree = tenant.planType === 'free';
    const isIntermedio =
      tenant.planType === 'enterprise' || tenant.planType === 'intermedio';

    return {
      planType: tenant.planType,
      products: {
        current: productCount,
        limit: isFree ? 10 : isIntermedio ? 75 : null,
      },
      users: { current: userCount, limit: isFree ? 1 : null },
      warehouses: {
        current: warehouseCount,
        limit: isFree || isIntermedio ? 1 : null,
      },
      customers: {
        current: customerCount,
        limit: isFree ? 2 : isIntermedio ? 15 : null,
      },
      suppliers: {
        current: supplierCount,
        limit: isFree ? 2 : isIntermedio ? 15 : null,
      },
      accountsPayable: {
        current: accountsPayableCount,
        limit: isFree ? 0 : isIntermedio ? 15 : null,
      },
      expenses: {
        current: expensesCount,
        limit: isFree ? 0 : isIntermedio ? 10 : null,
      },
      salesThisMonth,
      storageUsage,
    };
  }

  private async getStorageEstimate(tenantId: string) {
    const [products, sales, movements] = await Promise.all([
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.sale.count({ where: { tenantId } }),
      this.prisma.inventoryMovement.count({ where: { tenantId } }),
    ]);
    const mbEstimate = products * 0.005 + sales * 0.01 + movements * 0.002;
    return { estimateMB: Math.round(mbEstimate * 100) / 100 };
  }

  async upgradePlan(tenantId: string, newPlan: string) {
    const tenant = await this.licenseRepo.findTenantById(tenantId);
    if (!tenant) throw new Error('Tenant no encontrado');
    const planOrder = ['free', 'pro', 'enterprise'];
    const currentIndex = planOrder.indexOf(tenant.planType);
    const newIndex = planOrder.indexOf(newPlan);
    if (newIndex <= currentIndex) {
      throw new HttpException(
        'El nuevo plan debe ser superior al actual',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.licenseRepo.updatePlan(tenantId, newPlan);
  }

  async generate(dto: {
    targetTenantId?: string;
    days: number;
    tier?: string;
  }) {
    const payload = {
      targetTenantId: dto.targetTenantId,
      expiresAt: new Date(Date.now() + dto.days * 86400000).toISOString(),
      tier: dto.tier || 'pro',
    };
    const code = this.jwtService.sign(payload, {
      secret: process.env.LICENSE_JWT_SECRET!, // validated at bootstrap
    });
    return { code, expiresIn: `${dto.days} días` };
  }

  async activate(code: string, tenantId: string) {
    try {
      const payload = this.jwtService.verify(code, {
        secret: process.env.LICENSE_JWT_SECRET!, // validated at bootstrap
      });
      await this.licenseRepo.updateLicense(
        tenantId,
        new Date(payload.expiresAt),
        payload.tier || 'pro',
      );
      return {
        message: 'Licencia activada exitosamente',
        expiresAt: payload.expiresAt,
      };
    } catch (err: any) {
      const msg =
        err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError'
          ? 'El código de activación ingresado es inválido o ha expirado.'
          : err.message || 'Error al activar la licencia.';
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }
  }

  async cancel(tenantId: string) {
    const tenant = await this.licenseRepo.findTenantById(tenantId);
    if (!tenant) throw new Error('Tenant no encontrado');
    await this.licenseRepo.markAsCanceled(tenantId);
    return { message: 'Suscripción cancelada correctamente' };
  }

  async reactivate(tenantId: string) {
    const tenant = await this.licenseRepo.findTenantById(tenantId);
    if (!tenant) throw new Error('Tenant no encontrado');
    if (tenant.licenseExpiresAt && new Date() > tenant.licenseExpiresAt) {
      throw new Error(
        'No se puede reactivar: la licencia ya expiró. Genere un nuevo código de activación.',
      );
    }
    await this.licenseRepo.markAsActive(tenantId);
    return {
      message: 'Suscripción reactivada correctamente',
      expiresAt: tenant.licenseExpiresAt,
    };
  }
}
