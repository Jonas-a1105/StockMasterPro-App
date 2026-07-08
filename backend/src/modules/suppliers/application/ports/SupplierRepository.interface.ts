import { Supplier } from '../../domain/Supplier';

export interface SupplierRepository {
  findAll(tenantId: string): Promise<Supplier[]>;
  findById(id: string, tenantId: string): Promise<Supplier | null>;
  create(data: {
    tenantId: string;
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<Supplier>;
  update(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      contact: string;
      phone: string;
      email: string;
      address: string;
    }>,
  ): Promise<Supplier>;
  delete(id: string, tenantId: string): Promise<void>;
}
