import { Sale } from '../../domain/sale.entity';

export const SALES_REPOSITORY = Symbol('SALES_REPOSITORY');

export interface SaleRepository {
  findById(id: string, tenantId: string): Promise<Sale | null>;
  findAll(tenantId: string, limit?: number, offset?: number): Promise<Sale[]>;
  create(sale: Sale): Promise<Sale>;
  getDailySummary(tenantId: string): Promise<{ total: number; count: number }>;
}
