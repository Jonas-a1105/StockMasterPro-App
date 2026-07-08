import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SupplierRepository } from '../core/interfaces/SupplierRepository.interface';
import { Supplier } from '../domain/Supplier';

@Injectable()
export class PostgresSupplierRepo implements SupplierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<Supplier[]> {
    const suppliers = await this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    return suppliers.map((s) => this.toSupplier(s));
  }

  async findById(id: string, tenantId: string): Promise<Supplier | null> {
    const s = await this.prisma.supplier.findFirst({ where: { id, tenantId } });
    return s ? this.toSupplier(s) : null;
  }

  async create(data: {
    tenantId: string;
    name: string;
    contact?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<Supplier> {
    const s = await this.prisma.supplier.create({ data });
    return this.toSupplier(s);
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      contact: string;
      phone: string;
      email: string;
      address: string;
    }>,
  ): Promise<Supplier> {
    const s = await this.prisma.supplier.update({ where: { id }, data });
    return this.toSupplier(s);
  }

  async delete(id: string, _tenantId: string): Promise<void> {
    await this.prisma.supplier.delete({ where: { id } });
  }

  private toSupplier(s: any): Supplier {
    return new Supplier(
      s.id,
      s.tenantId,
      s.name,
      s.contact,
      s.phone,
      s.email,
      s.address,
      s.createdAt,
      s.updatedAt,
    );
  }
}
