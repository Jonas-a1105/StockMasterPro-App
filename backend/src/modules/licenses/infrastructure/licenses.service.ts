import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { PostgresLicenseRepo } from './persistence/postgres-license.repository';
import * as crypto from 'crypto';

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
    const jti = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + dto.days * 86400000);
    const payload = {
      jti,
      targetTenantId: dto.targetTenantId,
      expiresAt: expiresAt.toISOString(),
      tier: dto.tier || 'pro',
      iat: Math.floor(Date.now() / 1000),
    };
    
    // RS256 con clave privada (configurada en JWT_SECRET_RSA_PRIVATE)
    const code = this.jwtService.sign(payload, {
      secret: process.env.LICENSE_JWT_PRIVATE_KEY!,
      algorithm: 'RS256',
      keyid: process.env.LICENSE_KEY_ID || 'v1',
    });

    // Guardar licencia en BD con JTI
    await this.prisma.license.create({
      data: {
        jti: jti,
        tenantId: dto.targetTenantId || '',
        tier: dto.tier || 'pro',
        expiresAt: new Date(payload.exp),
        status: 'issued',
        payload: {
          jti,
          targetTenantId: dto.targetTenantId,
          exp: Math.floor(expiresAt.getTime() / 1000),
          tier: dto.tier || 'pro',
          iat: Math.floor(Date.now() / 1000),
        },
      });

    return { code, expiresIn: `${dto.days} días`, jti };
  }

  async activate(code: string, tenantId: string) {
    try {
      // Verificar con clave pública (RS256)
      const payload = this.jwtService.verify(code, {
        secret: process.env.LICENSE_JWT_PUBLIC_KEY!,
        algorithms: ['RS256'],
      }) as { jti: string; targetTenantId?: string; exp: number; tier: string };

      // Verificar que el JTI no haya sido usado
      const existingLicense = await this.prisma.license.findUnique({
        where: { jti: payload.jti },
      });
      if (existingLicense) {
        throw new HttpException(
          'Esta licencia ya ha sido utilizada',
          HttpStatus.FORBIDDEN,
        );
      }

      // Verificar tenant match
      if (payload.targetTenantId && payload.targetTenantId !== tenantId) {
        throw new HttpException(
          'El código de activación no corresponde a este tenant',
          HttpStatus.FORBIDDEN,
        );
      }

      const expiresAt = new Date(payload.exp * 1000);
      const tier = payload.tier || 'pro';

      // Guardar licencia en BD con JTI
      await this.prisma.license.create({
        data: {
          jti: payload.jti,
          tenantId,
          tier: payload.tier || 'pro',
          expiresAt: new Date(payload.exp * 1000),
          status: 'activated',
          activatedAt: new Date(),
          payload: {
            jti: payload.jti,
            targetTenantId: payload.targetTenantId,
            exp: payload.exp,
            tier: payload.tier,
            iat: payload.iat,
          },
        },
      });

      // Actualizar tenant
      await this.licenseRepo.updateLicense(
        tenantId,
        new Date(payload.exp * 1000),
        payload.tier || 'pro',
      );

      return {
        message: 'Licencia activada exitosamente',
        expiresAt: new Date(payload.exp * 1000).toISOString(),
      };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      const msg =
        err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError'
          ? 'El código de activación ingresado es inválido o ha expirado.'
          : err.message || 'Error al activar la licencia.';
      throw new HttpException(msg, HttpStatus.BAD_REQUEST);
    }
  }

  async getLicenseStatus(tenantId: string) {
    const tenant = await this.licenseRepo.findTenantById(tenantId);
    if (!tenant) throw new Error('Tenant no encontrado');

    // Verificar suscripción Stripe activa
    if (
      tenant.subscriptionStatus === 'active' &&
      tenant.stripeSubscriptionId &&
      tenant.licenseExpiresAt &&
      new Date() < tenant.licenseExpiresAt
    ) {
      return {
        source: 'stripe',
        tier: tenant.planType,
        expiresAt: tenant.licenseExpiresAt,
        isValid: true,
      };
    }

    // Verificar licencia manual activa
    const license = await this.prisma.license.findFirst({
      where: {
        tenantId,
        status: 'activated',
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'desc' },
    });

    if (license) {
      return {
        source: 'manual',
        tier: license.tier,
        expiresAt: license.expiresAt,
        isValid: true,
      };
    }

    // Sin licencia válida
    return {
      source: 'none',
      tier: 'free',
      expiresAt: null,
      isValid: false,
    };
  }

  async cancel(tenantId: string) {
    const tenant = await this.licenseRepo.findTenantById(tenantId);
    if (!tenant) throw new Error('Tenant no encontrado');
    await this.licenseRepo.markAsCanceled(tenantId);
    // Revocar licencias manuales pendientes
    await this.prisma.license.updateMany({
      where: { tenantId, status: 'issued' },
      data: { status: 'revoked', revokedAt: new Date() },
    });
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

  async getLicenses(tenantId: string) {
    return this.prisma.license.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
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
}