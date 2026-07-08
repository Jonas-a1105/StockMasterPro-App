import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async create(tenantId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        creditLimit: dto.creditLimit ?? 0,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateCustomerDto) {
    await this.findById(id, tenantId); // ownership check
    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId); // ownership check
    await this.prisma.customer.delete({ where: { id } });
  }

  async payCredit(id: string, tenantId: string, amount: number) {
    const customer = await this.findById(id, tenantId);
    const newBalance = Math.max(0, Number(customer.balance) - amount);
    return this.prisma.customer.update({
      where: { id },
      data: { balance: newBalance },
    });
  }
}
