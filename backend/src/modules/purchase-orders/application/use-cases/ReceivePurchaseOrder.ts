import { PurchaseOrderRepository } from '../ports/PurchaseOrderRepository.interface';
import { PurchaseOrder, PurchaseOrderItem } from '../../domain';

interface PurchaseOrderItemInput {
  productId: string;
  quantity: number;
  cost: number;
}

interface PurchaseOrderInput {
  tenantId: string;
  supplierId?: string;
  userId: string;
  items: PurchaseOrderItemInput[];
  notes?: string;
}

export class ReceivePurchaseOrder {
  constructor(private readonly poRepo: PurchaseOrderRepository) {}

  async execute(input: PurchaseOrderInput): Promise<PurchaseOrder> {
    if (input.items.length === 0) {
      throw new Error('Debe incluir al menos un producto en la orden.');
    }

    const items: PurchaseOrderItem[] = input.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      cost: i.cost,
      subtotal: i.quantity * i.cost,
    }));

    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    const order: PurchaseOrder = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      supplierId: input.supplierId ?? null,
      userId: input.userId,
      status: 'pending',
      total,
      notes: input.notes ?? null,
      items,
      createdAt: new Date(),
    };

    return this.poRepo.create(order);
  }
}
