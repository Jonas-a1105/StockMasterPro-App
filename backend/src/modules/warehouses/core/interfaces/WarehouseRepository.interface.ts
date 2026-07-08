import { Warehouse } from '../../domain/Warehouse';

export interface WarehouseRepository {
  findAll(tenantId: string): Promise<Warehouse[]>;
  findById(id: string): Promise<Warehouse | null>;
  create(data: { tenantId: string; name: string; code: string; address?: string }): Promise<Warehouse>;
  update(id: string, data: { name?: string; code?: string; address?: string; isActive?: boolean }): Promise<Warehouse>;
  delete(id: string): Promise<void>;
}
