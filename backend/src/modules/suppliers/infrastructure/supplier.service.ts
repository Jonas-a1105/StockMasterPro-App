import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' },
        take: limit,
        skip,
      }),
      this.prisma.supplier.count({ where: { tenantId } }),
    ]);
    return { data, total, limit, offset: skip };
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
    const { count } = await this.prisma.supplier.updateMany({
      where: { id, tenantId },
      data: dto,
    });
    if (count === 0) throw new NotFoundException('Proveedor no encontrado');
    return this.findById(id, tenantId);
  }

  async delete(id: string, tenantId: string) {
    const { count } = await this.prisma.supplier.deleteMany({
      where: { id, tenantId },
    });
    if (count === 0) throw new NotFoundException('Proveedor no encontrado');
  }
}
