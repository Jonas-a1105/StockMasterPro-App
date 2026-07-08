import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresCustomerRepo } from './PostgresCustomerRepo';

@Injectable()
export class CustomersService {
  constructor(private readonly customerRepo: PostgresCustomerRepo) {}

  async findAll(tenantId: string) {
    return this.customerRepo.findAll(tenantId);
  }

  async findById(id: string, tenantId: string) {
    const customer = await this.customerRepo.findById(id, tenantId);
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async create(data: {
    tenantId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    creditLimit?: number;
  }) {
    return this.customerRepo.create(data);
  }

  async update(id: string, tenantId: string, data: any) {
    await this.findById(id, tenantId);
    return this.customerRepo.update(id, tenantId, data);
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.customerRepo.delete(id, tenantId);
  }

  async addBalance(id: string, tenantId: string, amount: number) {
    const customer = await this.findById(id, tenantId);
    const newBalance = customer.balance + amount;
    return this.customerRepo.update(id, tenantId, { balance: newBalance });
  }

  async payCredit(id: string, tenantId: string, amount: number) {
    const customer = await this.findById(id, tenantId);
    const newBalance = Math.max(0, customer.balance - amount);
    return this.customerRepo.update(id, tenantId, { balance: newBalance });
  }
}
