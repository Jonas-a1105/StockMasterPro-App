import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class NotificationGeneratorService {
  private readonly logger = new Logger(NotificationGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async generateLowStockNotifications() {
    this.logger.log('Generando notificaciones de stock bajo...');

    const tenants = await this.prisma.tenant.findMany({
      where: { isBlocked: false },
      select: { id: true },
    });

    for (const tenant of tenants) {
      try {
        const expired = await this.prisma.product.findMany({
          where: { tenantId: tenant.id, isActive: true, stock: { lte: 0 } },
          select: { id: true, name: true, tenantId: true },
        });

        for (const product of expired) {
          const exists = await this.prisma.socialNotification.findFirst({
            where: {
              tenantId: tenant.id,
              type: 'low_stock',
              title: `Producto sin stock: ${product.name}`,
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          });
          if (!exists) {
            const admins = await this.prisma.user.findMany({
              where: {
                tenantId: tenant.id,
                isActive: true,
                role: { in: ['admin', 'gerente'] },
              },
              select: { id: true },
            });

            for (const admin of admins) {
              await this.prisma.socialNotification.create({
                data: {
                  tenantId: tenant.id,
                  userId: admin.id,
                  fromUserId: admin.id,
                  type: 'low_stock',
                  title: `Producto sin stock: ${product.name}`,
                  message: `"${product.name}" se ha quedado sin existencias. Reabastece el inventario.`,
                  link: `/inventory?search=${encodeURIComponent(product.name)}`,
                },
              });
            }
          }
        }

        const nearLow = await this.prisma.product.findMany({
          where: {
            tenantId: tenant.id,
            isActive: true,
            stock: { gt: 0, lte: 5 },
          },
          select: { id: true, name: true, stock: true, tenantId: true },
        });

        for (const product of nearLow) {
          const exists = await this.prisma.socialNotification.findFirst({
            where: {
              tenantId: tenant.id,
              type: 'low_stock',
              title: { contains: product.name },
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          });
          if (!exists) {
            const admins = await this.prisma.user.findMany({
              where: {
                tenantId: tenant.id,
                isActive: true,
                role: { in: ['admin', 'gerente'] },
              },
              select: { id: true },
            });

            for (const admin of admins) {
              await this.prisma.socialNotification.create({
                data: {
                  tenantId: tenant.id,
                  userId: admin.id,
                  fromUserId: admin.id,
                  type: 'low_stock',
                  title: `Stock mínimo alcanzado: ${product.name}`,
                  message: `"${product.name}" tiene solo ${product.stock} unidades.`,
                  link: `/inventory?search=${encodeURIComponent(product.name)}`,
                },
              });
            }
          }
        }
      } catch (err) {
        this.logger.error(
          `Error generando notificaciones para tenant ${tenant.id}`,
          err,
        );
      }
    }

    this.logger.log('Generación de notificaciones completada');
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async generateExpiringProductLotsNotifications() {
    this.logger.log('Generando notificaciones de lotes por vencer...');

    const tenants = await this.prisma.tenant.findMany({
      where: { isBlocked: false },
      select: { id: true },
    });

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    for (const tenant of tenants) {
      try {
        const expiringLots = await this.prisma.productLot.findMany({
          where: {
            tenantId: tenant.id,
            expiryDate: { lte: thirtyDaysFromNow, gte: new Date() },
            quantity: { gt: 0 },
          },
          select: {
            id: true,
            lotNumber: true,
            expiryDate: true,
            quantity: true,
            product: { select: { id: true, name: true } },
          },
        });

        for (const lot of expiringLots) {
          if (!lot.expiryDate) continue;
          const daysUntilExpiry = Math.ceil(
            (lot.expiryDate.getTime() - Date.now()) / 86400000,
          );
          const admins = await this.prisma.user.findMany({
            where: {
              tenantId: tenant.id,
              isActive: true,
              role: { in: ['admin', 'gerente'] },
            },
            select: { id: true },
          });

          for (const admin of admins) {
            await this.prisma.socialNotification.create({
              data: {
                tenantId: tenant.id,
                userId: admin.id,
                fromUserId: admin.id,
                type: 'low_stock',
                title: `Lote por vencer: ${lot.product.name}`,
                message: `Lote "${lot.lotNumber}" de "${lot.product.name}" vence en ${daysUntilExpiry} días (${lot.expiryDate.toLocaleDateString()}). Quedan ${lot.quantity} unidades.`,
                link: `/product-lots`,
              },
            });
          }
        }
      } catch (err) {
        this.logger.error(
          `Error generando notificaciones de lotes para tenant ${tenant.id}`,
          err,
        );
      }
    }
  }
}
