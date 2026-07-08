import { PurchaseOrderItem } from './PurchaseOrderItem';

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  supplierId: string | null;
  userId: string;
  status: string;
  total: number;
  notes: string | null;
  items: PurchaseOrderItem[];
  createdAt: Date;
}
