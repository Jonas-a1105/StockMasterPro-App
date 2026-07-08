import { Warehouse } from '../../domain/Warehouse';

export interface WarehouseRepository {
  findAll(tenantId: string): Promise<Warehouse[]>;
  findById(id: string, tenantId: string): Promise<Warehouse | null>;
  create(data: { tenantId: string; name: string; code: string; address?: string }): Promise<Warehouse>;
  update(id: string, tenantId: string, data: { name?: string; code?: string; address?: string; isActive?: boolean }): Promise<Warehouse>;
  delete(id: string, tenantId: string): Promise<void>;
}
