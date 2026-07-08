import { Sale } from '../../domain/Sale';

export interface SaleRepository {
  findById(id: string, tenantId: string): Promise<Sale | null>;
  findAll(tenantId: string, limit?: number, offset?: number): Promise<Sale[]>;
  create(sale: Sale): Promise<Sale>;
  getDailySummary(tenantId: string): Promise<{ total: number; count: number }>;
}
