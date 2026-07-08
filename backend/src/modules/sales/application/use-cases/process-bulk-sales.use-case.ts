import { Injectable } from '@nestjs/common';
import { ProcessSaleUseCase } from './process-sale.use-case';
import { Sale, PaymentMethod } from '../../domain/sale.entity';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

interface ProcessSaleInput {
  items: { productId: string; quantity: number }[];
  paymentMethod?: string;
  discount?: number;
  taxRate?: number;
  customerId?: string;
  idempotencyKey?: string;
}

@Injectable()
export class ProcessBulkSalesUseCase {
  constructor(
    private readonly processSaleUseCase: ProcessSaleUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    sales: ProcessSaleInput[],
    user: { tenantId: string; id: string },
  ): Promise<{ index: number; success: boolean; data?: Sale; error?: string }[]> {
    const results: { index: number; success: boolean; data?: Sale; error?: string }[] = [];

    for (let i = 0; i < sales.length; i++) {
      try {
        const idempotencyKey = sales[i].idempotencyKey || sales[i].items?.toString();

        if (idempotencyKey) {
          const existing = await this.prisma.sale.findFirst({
            where: { offlineId: idempotencyKey, tenantId: user.tenantId },
          });
          if (existing) {
            results.push({
              index: i,
              success: true,
              error: `Venta duplicada omitida (${idempotencyKey.slice(0, 8)}...)`,
            });
            continue;
          }
        }

        const result = await this.processSaleUseCase.execute({
          tenantId: user.tenantId,
          userId: user.id,
          items: sales[i].items,
          paymentMethod: (sales[i].paymentMethod as PaymentMethod) ?? 'cash',
          discount: sales[i].discount ?? 0,
          taxRate: sales[i].taxRate ?? 0,
          customerId: sales[i].customerId,
          offlineId: idempotencyKey,
        });
        results.push({ index: i, success: true, data: result });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        results.push({ index: i, success: false, error: message });
      }
    }
    return results;
  }
}
