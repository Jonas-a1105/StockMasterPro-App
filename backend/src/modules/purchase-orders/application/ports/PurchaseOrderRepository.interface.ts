import { PurchaseOrder } from '../../domain/PurchaseOrder';

export interface PurchaseOrderRepository {
  findAll(tenantId: string): Promise<PurchaseOrder[]>;
  findById(id: string, tenantId: string): Promise<PurchaseOrder | null>;
  create(order: PurchaseOrder): Promise<PurchaseOrder>;
}
