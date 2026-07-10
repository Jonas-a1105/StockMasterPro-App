import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { InvoiceSequenceService } from '../../application/invoice-sequence.service';
import { TaxWithholdingService } from '../../application/tax-withholding.service';

@Controller('fiscal')
export class FiscalController {
  constructor(
    private readonly seqService: InvoiceSequenceService,
    private readonly whService: TaxWithholdingService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('sequence')
  @Roles('admin')
  async getSequence(@CurrentUser() user: AuthenticatedUser) {
    return this.seqService.getOrCreateSequence(user.tenantId);
  }

  @Patch('sequence')
  @Roles('admin')
  async resetSequence(
    @Body() body: { series: string; nextNumber: number },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.seqService.resetSequence(user.tenantId, body.series, body.nextNumber);
  }

  @Get('withholdings')
  @Roles('admin', 'gerente')
  async getWithholdings(
    @Query('type') type: 'iva' | 'islr',
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.whService.getWithholdings(user.tenantId, type);
  }

  @Post('withholdings')
  @Roles('admin', 'gerente')
  async createWithholding(
    @Body() body: {
      type: 'iva' | 'islr';
      baseAmount: number; rate: number; amount: number;
      supplierId?: string; purchaseOrderId?: string;
      invoiceNumber?: string; invoiceDate?: string; notes?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.whService.createWithholding({
      ...body,
      tenantId: user.tenantId,
      invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
    });
  }

  @Get('books/:type')
  @Roles('admin', 'gerente')
  async getBooks(
    @Param('type') type: 'ventas' | 'compras',
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.whService.getBooks(
      user.tenantId,
      type,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('company-info')
  @Roles('admin', 'gerente')
  async getCompanyInfo(@CurrentUser() user: AuthenticatedUser) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { name: true },
    });
    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId: user.tenantId },
    });
    return {
      companyName: tenant?.name || '',
      companyTaxId: settings?.companyTaxId || '',
      companyFiscalAddress: settings?.companyFiscalAddress || '',
      companyPhone: settings?.companyPhone || '',
      taxRate: Number(settings?.taxRate ?? 16),
      taxName: settings?.taxName || 'IVA',
      currencySymbol: settings?.currencySymbol || 'Bs',
    };
  }
}
