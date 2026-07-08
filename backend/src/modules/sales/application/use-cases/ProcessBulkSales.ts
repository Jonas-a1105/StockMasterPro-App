import { Injectable } from '@nestjs/common';
import { ProcessSaleUseCase } from './ProcessSale';
import { Sale, PaymentMethod } from '../../domain/Sale';

interface ProcessSaleInput {
  items: { productId: string; quantity: number }[];
  paymentMethod?: string;
  discount?: number;
  taxRate?: number;
  customerId?: string;
}

@Injectable()
export class ProcessBulkSalesUseCase {
  constructor(
    private readonly processSaleUseCase: ProcessSaleUseCase,
  ) {}

  async execute(
    sales: ProcessSaleInput[],
    user: { tenantId: string; id: string },
  ): Promise<{ index: number; success: boolean; data?: Sale; error?: string }[]> {
    const results: { index: number; success: boolean; data?: Sale; error?: string }[] = [];

    for (let i = 0; i < sales.length; i++) {
      try {
        const result = await this.processSaleUseCase.execute({
          tenantId: user.tenantId,
          userId: user.id,
          items: sales[i].items,
          paymentMethod: (sales[i].paymentMethod as PaymentMethod) ?? 'cash',
          discount: sales[i].discount ?? 0,
          taxRate: sales[i].taxRate ?? 0,
          customerId: sales[i].customerId,
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
