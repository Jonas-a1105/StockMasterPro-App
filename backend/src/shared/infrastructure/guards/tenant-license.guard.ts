import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { SKIP_LICENSE_CHECK_KEY } from '../decorators/skip-license-check.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantLicenseGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const skipLicenseCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_LICENSE_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipLicenseCheck) return true;

    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) return false;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) return false;

    if (tenant.isBlocked || tenant.subscriptionStatus === 'canceled') {
      throw new HttpException(
        'Licencia suspendida. Contacte a soporte.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const now = new Date();
    if (now > tenant.licenseExpiresAt) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { isBlocked: true },
      });
      throw new HttpException(
        'Su periodo de gracia ha expirado. Regularice su pago.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
