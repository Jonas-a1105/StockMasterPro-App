import { Injectable, Inject } from '@nestjs/common';
import type { SaleRepository } from '../application/ports/SaleRepository.interface';
import type { ProductRepository } from '../../inventory/application/ports/ProductRepository.interface';
import { ProcessSale } from '../application/use-cases/ProcessSale';
import { Sale, PaymentMethod } from '../domain';
import { ProcessSaleDto } from './dto/process-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    @Inject('SaleRepository')
    private readonly saleRepo: SaleRepository,
    @Inject('ProductRepository')
    private readonly productRepo: ProductRepository,
  ) {}

  async processSale(input: {
    tenantId: string;
    userId: string;
    items: { productId: string; quantity: number }[];
    paymentMethod?: string;
    discount?: number;
    taxRate?: number;
    customerId?: string;
  }) {
    const useCase = new ProcessSale(this.saleRepo, this.productRepo);
    return useCase.execute({
      tenantId: input.tenantId,
      userId: input.userId,
      items: input.items,
      paymentMethod: (input.paymentMethod as PaymentMethod) ?? 'cash',
      discount: input.discount ?? 0,
      taxRate: input.taxRate ?? 0,
      customerId: input.customerId,
    });
  }

  async processBulkSales(
    sales: ProcessSaleDto[],
    user: { tenantId: string; id: string },
  ) {
    const results: { index: number; success: boolean; data?: Sale; error?: string }[] = [];

    for (let i = 0; i < sales.length; i++) {
      try {
        const result = await this.processSale({
          ...sales[i],
          tenantId: user.tenantId,
          userId: user.id,
        });
        results.push({ index: i, success: true, data: result });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        results.push({ index: i, success: false, error: message });
      }
    }
    return results;
  }

  async findAll(tenantId: string) {
    return this.saleRepo.findAll(tenantId);
  }

  async findById(id: string, tenantId: string) {
    return this.saleRepo.findById(id, tenantId);
  }

  async getDailySummary(tenantId: string) {
    return this.saleRepo.getDailySummary(tenantId);
  }
}
