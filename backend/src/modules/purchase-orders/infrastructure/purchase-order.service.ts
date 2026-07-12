import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresPurchaseOrderRepo } from './persistence/postgres-purchase-order.repository';

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

  async create(input: {
    tenantId: string;
    supplierId?: string;
    userId: string;
    items: { productId: string; quantity: number; cost: number }[];
    notes?: string;
  }) {
    const total = input.items.reduce((sum, i) => sum + i.quantity * i.cost, 0);
    return this.poRepo.create({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      supplierId: input.supplierId ?? '',
      userId: input.userId,
      status: 'pending',
      total,
      notes: input.notes,
      items: input.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        cost: i.cost,
        subtotal: i.quantity * i.cost,
      })),
    });
  }

  async approveOrder(id: string, tenantId: string, userId: string) {
    return this.poRepo.approveOrder(id, tenantId, userId);
  }

  async rejectOrder(
    id: string,
    tenantId: string,
    userId: string,
    reason?: string,
  ) {
    return this.poRepo.rejectOrder(id, tenantId, userId, reason);
  }

  async cancelOrder(
    id: string,
    tenantId: string,
    userId: string,
    reason?: string,
  ) {
    return this.poRepo.cancelOrder(id, tenantId, userId, reason);
  }

  async receiveOrder(
    id: string,
    tenantId: string,
    items?: { productId: string; quantity: number }[],
  ) {
    return this.poRepo.receiveOrder(id, tenantId, items);
  }
}
