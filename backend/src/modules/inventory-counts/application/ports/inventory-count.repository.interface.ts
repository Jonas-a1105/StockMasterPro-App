import { InventoryCount, InventoryCountItem } from '@modules/inventory-counts';

export const INVENTORY_COUNT_REPOSITORY = Symbol('INVENTORY_COUNT_REPOSITORY');

export interface InventoryCountFilters {
  search?: string;
  status?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
}

export interface InventoryCountRepository {
  findById(id: string, tenantId: string): Promise<InventoryCount | null>;
  findAll(
    tenantId: string,
    filters?: InventoryCountFilters,
    limit?: number,
    offset?: number,
  ): Promise<InventoryCount[]>;
  count(tenantId: string, filters?: InventoryCountFilters): Promise<number>;
  create(count: InventoryCount): Promise<InventoryCount>;
  update(count: InventoryCount): Promise<InventoryCount>;
  addItems(countId: string, items: InventoryCountItem[]): Promise<InventoryCount>;
  updateItem(item: InventoryCountItem): Promise<InventoryCountItem>;
  getItem(itemId: string, tenantId: string): Promise<InventoryCountItem | null>;
  getSystemQuantities(productIds: string[], tenantId: string, warehouseId?: string): Promise<Map<string, number>>;
}