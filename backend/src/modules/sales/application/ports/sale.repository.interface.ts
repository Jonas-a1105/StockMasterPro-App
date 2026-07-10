import { Sale } from '../../domain/sale.entity';

export const SALES_REPOSITORY = Symbol('SALES_REPOSITORY');

export interface SaleFilters {
  search?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentMethod?: string;
  status?: string;
}

export interface SaleRepository {
  findById(id: string, tenantId: string): Promise<Sale | null>;
  findAll(
    tenantId: string,
    filters?: SaleFilters,
    limit?: number,
    offset?: number,
  ): Promise<Sale[]>;
  count(tenantId: string, filters?: SaleFilters): Promise<number>;
  create(sale: Sale, offlineId?: string): Promise<Sale>;
  voidSale(id: string, tenantId: string): Promise<void>;
  getDailySummary(tenantId: string): Promise<{ total: number; count: number }>;
}
