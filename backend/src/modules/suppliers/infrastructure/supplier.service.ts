import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresSupplierRepo } from './PostgresSupplierRepo';

@Injectable()
export class SupplierService {
  constructor(private readonly supplierRepo: PostgresSupplierRepo) {}

  async findAll(tenantId: string) {
    return this.supplierRepo.findAll(tenantId);
  }

  async findById(id: string, tenantId: string) {
    const supplier = await this.supplierRepo.findById(id, tenantId);
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async create(data: {
    tenantId: string;
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) {
    return this.supplierRepo.create(data);
  }

  async update(id: string, tenantId: string, data: any) {
    await this.findById(id, tenantId);
    return this.supplierRepo.update(id, tenantId, data);
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.supplierRepo.delete(id, tenantId);
  }
}
