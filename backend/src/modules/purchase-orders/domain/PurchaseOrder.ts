import { PurchaseOrderItem } from './PurchaseOrderItem';

export class PurchaseOrder {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly supplierId: string | null,
    public readonly userId: string,
    public readonly status: string,
    public readonly total: number,
    public readonly notes: string | null,
    public readonly items: PurchaseOrderItem[],
    public readonly createdAt: Date,
  ) {}
}
