import { PurchaseOrderRepository } from './interfaces/PurchaseOrderRepository.interface';
import { PurchaseOrder, PurchaseOrderItem } from '../domain';

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
    const items: PurchaseOrderItem[] = input.items.map(
      (i) =>
        new PurchaseOrderItem(
          i.productId,
          i.quantity,
          i.cost,
          i.quantity * i.cost,
        ),
    );
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);

    const order = new PurchaseOrder(
      crypto.randomUUID(),
      input.tenantId,
      input.supplierId ?? null,
      input.userId,
      'pending',
      total,
      input.notes ?? null,
      items,
      new Date(),
    );

    return this.poRepo.create(order);
  }
}
