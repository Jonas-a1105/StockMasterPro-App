import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CustomerRepository, CreateCustomerData } from '../../application/ports/customer.repository.interface';
import { Customer } from '../../domain/customer.entity';
import { Customer as PrismaCustomer } from '@prisma/client';

@Injectable()
export class PostgresCustomerRepo implements CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<Customer[]> {
    const rows = await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string, tenantId: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const row = await this.prisma.customer.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        creditLimit: data.creditLimit ?? 0,
        balance: 0,
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, tenantId: string, data: Partial<CreateCustomerData> & { balance?: number }): Promise<Customer> {
    const { count } = await this.prisma.customer.updateMany({
      where: { id, tenantId },
      data,
    });
    if (count === 0) throw new NotFoundException('Cliente no encontrado');
    const updated = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });
    if (!updated) throw new NotFoundException('Cliente no encontrado');
    return this.toDomain(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { count } = await this.prisma.customer.deleteMany({
      where: { id, tenantId },
    });
    if (count === 0) throw new NotFoundException('Cliente no encontrado');
  }

  private toDomain(r: PrismaCustomer): Customer {
    return new Customer(
      r.id,
      r.tenantId,
      r.name,
      r.email,
      r.phone,
      r.address,
      Number(r.creditLimit),
      Number(r.balance),
      r.createdAt,
      r.updatedAt,
    );
  }
}
