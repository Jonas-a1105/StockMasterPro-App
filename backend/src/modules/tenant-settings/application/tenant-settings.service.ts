import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class TenantSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenant(tenantId: string) {
    let settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      settings = await this.prisma.tenantSettings.create({
        data: { tenantId },
      });
    }

    return settings;
  }

  async update(
    tenantId: string,
    dto: {
      taxRate?: number;
      taxName?: string;
      currencySymbol?: string;
      currencyPosition?: string;
      decimalPlaces?: number;
      displayCurrency?: string;
      manualExchangeRate?: number;
      companyTaxId?: string;
      companyFiscalAddress?: string;
      companyPhone?: string;
    },
  ) {
    const settings = await this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...dto },
      update: dto,
    });
    return settings;
  }
}
