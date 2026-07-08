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
    const { count } = await this.prisma.customer.updateMany({
      where: { id, tenantId },
      data: dto,
    });
    if (count === 0) throw new NotFoundException('Cliente no encontrado');
    return this.findById(id, tenantId);
  }

  async delete(id: string, tenantId: string) {
    const { count } = await this.prisma.customer.deleteMany({
      where: { id, tenantId },
    });
    if (count === 0) throw new NotFoundException('Cliente no encontrado');
  }

  async payCredit(id: string, tenantId: string, amount: number) {
    const customer = await this.findById(id, tenantId);
    const newBalance = Math.max(0, Number(customer.balance) - amount);
    const { count } = await this.prisma.customer.updateMany({
      where: { id, tenantId },
      data: { balance: newBalance },
    });
    if (count === 0) throw new NotFoundException('Cliente no encontrado');
    return this.findById(id, tenantId);
  }
}
