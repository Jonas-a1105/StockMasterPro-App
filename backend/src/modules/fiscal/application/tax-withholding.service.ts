import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export interface WithholdingResult {
  iva: { baseAmount: number; rate: number; amount: number } | null;
  islr: { baseAmount: number; rate: number; amount: number } | null;
}

@Injectable()
export class TaxWithholdingService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateWithholdings(params: {
    tenantId: string;
    supplierId?: string;
    totalAmount: number;
    taxAmount: number;
    invoiceDate?: Date;
  }): Promise<WithholdingResult> {
    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId: params.tenantId },
    });

    const ivaRate = Number(settings?.ivaWithholdingRate ?? 75);
    const islrRate = Number(settings?.islrWithholdingRate ?? 5);

    const iva = {
      baseAmount: params.taxAmount,
      rate: ivaRate,
      amount: Math.round(params.taxAmount * (ivaRate / 100) * 100) / 100,
    };

    const islr = {
      baseAmount: params.totalAmount - params.taxAmount,
      rate: islrRate,
      amount:
        Math.round(
          (params.totalAmount - params.taxAmount) * (islrRate / 100) * 100,
        ) / 100,
    };

    return {
      iva: iva.amount > 0 ? iva : null,
      islr: islr.amount > 0 ? islr : null,
    };
  }

  async createWithholding(data: {
    tenantId: string;
    supplierId?: string;
    purchaseOrderId?: string;
    type: 'iva' | 'islr';
    baseAmount: number;
    rate: number;
    amount: number;
    invoiceNumber?: string;
    invoiceDate?: Date;
    notes?: string;
  }) {
    return this.prisma.taxWithholding.create({
      data: {
        tenantId: data.tenantId,
        supplierId: data.supplierId,
        purchaseOrderId: data.purchaseOrderId,
        type: data.type,
        baseAmount: data.baseAmount,
        rate: data.rate,
        amount: data.amount,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        notes: data.notes,
      },
    });
  }

  async getWithholdings(tenantId: string, type?: 'iva' | 'islr') {
    return this.prisma.taxWithholding.findMany({
      where: { tenantId, ...(type ? { type } : {}) },
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBooks(
    tenantId: string,
    type: 'ventas' | 'compras',
    startDate?: Date,
    endDate?: Date,
  ) {
    if (type === 'ventas') {
      const sales = await this.prisma.sale.findMany({
        where: {
          tenantId,
          status: 'completed',
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        include: { customer: true, items: true },
        orderBy: { createdAt: 'desc' },
      });

      return sales.map((s) => ({
        invoiceNumber: s.invoiceNumber || s.id.slice(0, 8),
        documentType: s.documentType || 'factura',
        date: s.createdAt,
        customerName: s.customer?.name || 'Consumidor Final',
        customerTaxId: s.customer?.taxId || 'N/A',
        subtotal: Number(s.subtotal),
        tax: Number(s.tax),
        discount: Number(s.discount),
        total: Number(s.total),
        items: s.items.length,
      }));
    }

    if (type === 'compras') {
      const pOrders = await this.prisma.purchaseOrder.findMany({
        where: {
          tenantId,
          status: { in: ['received', 'completed'] },
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        include: { supplier: true },
        orderBy: { createdAt: 'desc' },
      });

      const withholdings = await this.prisma.taxWithholding.findMany({
        where: { tenantId },
      });

      const whMap = new Map<string, (typeof withholdings)[0][]>();
      for (const wh of withholdings) {
        const key = wh.purchaseOrderId || wh.supplierId || '';
        if (!whMap.has(key)) whMap.set(key, []);
        whMap.get(key)!.push(wh);
      }

      return pOrders.map((po) => {
        const wh = whMap.get(po.id) || [];
        const ivaWh = wh.find((w) => w.type === 'iva');
        const islrWh = wh.find((w) => w.type === 'islr');

        const total = Number(po.total);

        return {
          invoiceNumber: po.id.slice(0, 8),
          supplierName: po.supplier?.name || 'N/A',
          supplierTaxId: po.supplier?.taxId || 'N/A',
          date: po.createdAt,
          total,
          ivaWithholding: ivaWh ? Number(ivaWh.amount) : 0,
          islrWithholding: islrWh ? Number(islrWh.amount) : 0,
        };
      });
    }

    return [];
  }
}
