import { Injectable } from '@nestjs/common';
import { PostgresSaleRepo } from './PostgresSaleRepo';
import { PostgresProductRepo } from '../../inventory/infrastructure/PostgresProductRepo';
import { ProcessSale } from '../core/ProcessSale';
import { PaymentMethod } from '../domain';

@Injectable()
export class SalesService {
  constructor(
    private readonly saleRepo: PostgresSaleRepo,
    private readonly productRepo: PostgresProductRepo,
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

  async processBulkSales(sales: any[], user: any) {
    const results = [];
    for (const dto of sales) {
      const result = await this.processSale({
        ...dto,
        tenantId: user.tenantId,
        userId: user.id,
      });
      results.push(result);
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
