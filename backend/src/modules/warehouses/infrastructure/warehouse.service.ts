import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException('Almacén no encontrado');
    }
    return warehouse;
  }

  async create(tenantId: string, dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        address: dto.address,
      },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateWarehouseDto) {
    await this.findById(id, tenantId); // checks ownership and throws 404 if not found
    return this.prisma.warehouse.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId); // checks ownership
    // Unlink products associated with this warehouse
    await this.prisma.product.updateMany({
      where: { warehouseId: id },
      data: { warehouseId: null },
    });
    // Delete the warehouse
    await this.prisma.warehouse.delete({
      where: { id },
    });
  }
}
