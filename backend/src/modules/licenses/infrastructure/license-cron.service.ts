import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class LicenseCronService {
  private readonly logger = new Logger(LicenseCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Se ejecuta cada hora para marcar inquilinos expirados como bloqueados de forma segura
  @Cron(CronExpression.EVERY_HOUR)
  async blockExpiredTenants() {
    const now = new Date();
    try {
      // Bloquear tenants cuya licencia haya expirado y no estén bloqueados ya
      const expiredCount = await this.prisma.tenant.updateMany({
        where: {
          licenseExpiresAt: { lt: now },
          isBlocked: false,
        },
        data: {
          isBlocked: true,
        },
      });

      if (expiredCount.count > 0) {
        this.logger.log(
          `[LicenseCron] Se bloquearon ${expiredCount.count} inquilinos con licencia expirada.`,
        );
      }
    } catch (err) {
      this.logger.error(
        '[LicenseCron] Error al bloquear inquilinos expirados:',
        err,
      );
    }
  }
}
