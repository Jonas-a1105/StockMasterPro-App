import { Sale } from '../../domain/sale.entity';

export const SALES_REPOSITORY = Symbol('SALES_REPOSITORY');

export interface SalePaymentInput {
  paymentMethod: string;
  amount: number;
  exchangeRate?: number;
  reference?: string;
}

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
  create(
    sale: Sale,
    offlineId?: string,
    payments?: SalePaymentInput[],
  ): Promise<Sale>;
  voidSale(id: string, tenantId: string): Promise<void>;
  getDailySummary(tenantId: string): Promise<{ total: number; count: number }>;
}
