import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresPurchaseOrderRepo } from './PostgresPurchaseOrderRepo';
import { ReceivePurchaseOrder } from '../core/ReceivePurchaseOrder';

@Injectable()
export class PurchaseOrderService {
  constructor(private readonly poRepo: PostgresPurchaseOrderRepo) {}

  async findAll(tenantId: string) {
    return this.poRepo.findAll(tenantId);
  }

  async findById(id: string, tenantId: string) {
    const order = await this.poRepo.findById(id, tenantId);
    if (!order) throw new NotFoundException('Orden de compra no encontrada');
    return order;
  }

  async receive(input: {
    tenantId: string;
    supplierId?: string;
    userId: string;
    items: { productId: string; quantity: number; cost: number }[];
    notes?: string;
  }) {
    const useCase = new ReceivePurchaseOrder(this.poRepo);
    return useCase.execute(input);
  }
}
