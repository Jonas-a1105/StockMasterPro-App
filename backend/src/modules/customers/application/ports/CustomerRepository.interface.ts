import { Customer } from '../../domain/Customer';

export interface CustomerRepository {
  findAll(tenantId: string): Promise<Customer[]>;
  findById(id: string, tenantId: string): Promise<Customer | null>;
  create(data: {
    tenantId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    creditLimit?: number;
  }): Promise<Customer>;
  update(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      address: string;
      creditLimit: number;
      balance: number;
    }>,
  ): Promise<Customer>;
  delete(id: string, tenantId: string): Promise<void>;
}
