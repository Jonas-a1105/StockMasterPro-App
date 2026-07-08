import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
    });
    if (!supplier) throw new NotFoundException('Proveedor no encontrado');
    return supplier;
  }

  async create(tenantId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        tenantId,
        name: dto.name,
        contact: dto.contact,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateSupplierDto) {
    await this.findById(id, tenantId);
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.prisma.supplier.delete({ where: { id } });
  }
}
