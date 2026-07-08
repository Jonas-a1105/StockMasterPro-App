import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { WarehouseRepository } from '../../application/ports/WarehouseRepository.interface';
import { Warehouse } from '../../domain/Warehouse';

@Injectable()
export class PostgresWarehouseRepo implements WarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<Warehouse[]> {
    const rows = await this.prisma.warehouse.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
    return rows.map(r => new Warehouse(r.id, r.tenantId, r.name, r.code, r.address, r.isActive, r.createdAt, r.updatedAt));
  }

  async findById(id: string, tenantId: string): Promise<Warehouse | null> {
    const r = await this.prisma.warehouse.findFirst({ where: { id, tenantId } });
    return r ? new Warehouse(r.id, r.tenantId, r.name, r.code, r.address, r.isActive, r.createdAt, r.updatedAt) : null;
  }

  async create(data: { tenantId: string; name: string; code: string; address?: string }): Promise<Warehouse> {
    const r = await this.prisma.warehouse.create({ data: { tenantId: data.tenantId, name: data.name, code: data.code, address: data.address } });
    return new Warehouse(r.id, r.tenantId, r.name, r.code, r.address, r.isActive, r.createdAt, r.updatedAt);
  }

  async update(id: string, tenantId: string, data: { name?: string; code?: string; address?: string; isActive?: boolean }): Promise<Warehouse> {
    const existing = await this.prisma.warehouse.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Almacén no encontrado');
    const r = await this.prisma.warehouse.update({ where: { id }, data });
    return new Warehouse(r.id, r.tenantId, r.name, r.code, r.address, r.isActive, r.createdAt, r.updatedAt);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.prisma.warehouse.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Almacén no encontrado');
    await this.prisma.product.updateMany({ where: { warehouseId: id }, data: { warehouseId: null } });
    await this.prisma.warehouse.delete({ where: { id } });
  }
}
