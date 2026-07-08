import { Customer } from '../../domain/customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface CreateCustomerData {
  tenantId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number;
}

export interface CustomerRepository {
  findAll(tenantId: string, limit?: number, offset?: number): Promise<Customer[]>;
  count(tenantId: string): Promise<number>;
  findById(id: string, tenantId: string): Promise<Customer | null>;
  create(data: CreateCustomerData): Promise<Customer>;
  update(id: string, tenantId: string, data: Partial<CreateCustomerData> & { balance?: number }): Promise<Customer>;
  delete(id: string, tenantId: string): Promise<void>;
}
