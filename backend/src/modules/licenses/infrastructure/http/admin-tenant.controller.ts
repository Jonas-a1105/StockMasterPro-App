import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { SkipLicenseCheck } from '@shared/infrastructure/decorators/skip-license-check.decorator';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { PostgresLicenseRepo } from '../persistence/postgres-license.repository';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@SkipLicenseCheck()
export class AdminTenantController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly licenseRepo: PostgresLicenseRepo,
  ) {}

  @Get()
  async findAll() {
    const rows = await this.prisma.tenant.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      planType: r.planType,
      subscriptionStatus: r.subscriptionStatus,
      licenseExpiresAt: r.licenseExpiresAt,
      isBlocked: r.isBlocked,
      createdAt: r.createdAt,
    }));
  }

  @Post(':id/block')
  async block(@Param('id') id: string) {
    await this.licenseRepo.markAsBlocked(id);
    return { message: 'Tenant bloqueado correctamente' };
  }

  @Post(':id/unblock')
  async unblock(@Param('id') id: string) {
    await this.licenseRepo.markAsActive(id);
    return { message: 'Tenant desbloqueado correctamente' };
  }

  @Post(':id/extend')
  async extend(@Param('id') id: string, @Body() body: { days: number }) {
    const tenant = await this.licenseRepo.findTenantById(id);
    if (!tenant) throw new Error('Tenant no encontrado');

    const currentExpiry = tenant.licenseExpiresAt;
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate.getTime() + body.days * 86400000);

    await this.prisma.tenant.update({
      where: { id },
      data: {
        licenseExpiresAt: newExpiry,
        isBlocked: false,
      },
    });
    return {
      message: `Licencia extendida ${body.days} días`,
      expiresAt: newExpiry,
    };
  }

  @Post(':id/plan')
  async changePlan(
    @Param('id') id: string,
    @Body() body: { planType: string },
  ) {
    await this.prisma.tenant.update({
      where: { id },
      data: { planType: body.planType },
    });
    return { message: `Plan cambiado a ${body.planType}` };
  }
}
