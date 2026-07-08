import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CustomerRepository } from '../../application/ports/CustomerRepository.interface';
import { Customer } from '../../domain/Customer';

@Injectable()
export class PostgresCustomerRepo implements CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<Customer[]> {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    return customers.map((c) => this.toCustomer(c));
  }

  async findById(id: string, tenantId: string): Promise<Customer | null> {
    const c = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    return c ? this.toCustomer(c) : null;
  }

  async create(data: {
    tenantId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    creditLimit?: number;
  }): Promise<Customer> {
    const c = await this.prisma.customer.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        creditLimit: data.creditLimit ?? 0,
      },
    });
    return this.toCustomer(c);
  }

  async update(
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
  ): Promise<Customer> {
    const existing = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Cliente no encontrado');
    const c = await this.prisma.customer.update({ where: { id }, data });
    return this.toCustomer(c);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Cliente no encontrado');
    await this.prisma.customer.delete({ where: { id } });
  }

  private toCustomer(c: any): Customer {
    return new Customer(
      c.id,
      c.tenantId,
      c.name,
      c.email,
      c.phone,
      c.address,
      Number(c.creditLimit),
      Number(c.balance),
      c.createdAt,
      c.updatedAt,
    );
  }
}
