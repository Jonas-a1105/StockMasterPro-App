import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  InventoryCountRepository,
  InventoryCountFilters,
} from '../../application/ports/inventory-count.repository.interface';
import {
  InventoryCount,
  InventoryCountItem,
} from '../../domain/inventory-count.entity';

@Injectable()
export class PostgresInventoryCountRepo implements InventoryCountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<InventoryCount | null> {
    const count = await this.prisma.inventoryCount.findFirst({
      where: { id, tenantId },
      include: { items: true, warehouse: true, user: true, approver: true },
    });
    return count ? this.toCount(count) : null;
  }

  async findAll(
    tenantId: string,
    filters?: InventoryCountFilters,
    limit = 50,
    offset = 0,
  ): Promise<InventoryCount[]> {
    const where: any = { tenantId };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.warehouseId) where.warehouseId = filters.warehouseId;
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { id: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    const counts = await this.prisma.inventoryCount.findMany({
      where,
      include: { items: true, warehouse: true, user: true, approver: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    return counts.map((c) => this.toCount(c));
  }

  async count(
    tenantId: string,
    filters?: InventoryCountFilters,
  ): Promise<number> {
    const where: any = { tenantId };
    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.warehouseId) where.warehouseId = filters.warehouseId;
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { id: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }
    return this.prisma.inventoryCount.count({ where });
  }

  async create(count: InventoryCount): Promise<InventoryCount> {
    const created = await this.prisma.inventoryCount.create({
      data: {
        id: count.id,
        tenantId: count.tenantId,
        warehouseId: count.warehouseId,
        userId: count.userId,
        status: count.status,
        name: count.name,
        notes: count.notes,
        startedAt: count.startedAt,
        completedAt: count.completedAt,
        approvedBy: count.approvedBy,
        approvedAt: count.approvedAt,
        items:
          count.items.length > 0
            ? {
                create: count.items.map((item) => ({
                  id: item.id,
                  tenantId: item.tenantId,
                  productId: item.productId,
                  productWarehouseId: item.productWarehouseId,
                  systemQty: item.systemQty,
                  countedQty: item.countedQty,
                  difference: item.difference,
                  notes: item.notes,
                })),
              }
            : undefined,
      },
      include: { items: true },
    });
    return this.toCount(created);
  }

  async update(count: InventoryCount): Promise<InventoryCount> {
    const updated = await this.prisma.inventoryCount.update({
      where: { id: count.id },
      data: {
        status: count.status,
        name: count.name,
        notes: count.notes,
        warehouseId: count.warehouseId,
        startedAt: count.startedAt,
        completedAt: count.completedAt,
        approvedBy: count.approvedBy,
        approvedAt: count.approvedAt,
      },
      include: { items: true, warehouse: true, user: true, approver: true },
    });
    return this.toCount(updated);
  }

  async addItems(
    countId: string,
    items: InventoryCountItem[],
  ): Promise<InventoryCount> {
    await this.prisma.inventoryCountItem.createMany({
      data: items.map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        inventoryCountId: countId,
        productId: item.productId,
        productWarehouseId: item.productWarehouseId,
        systemQty: item.systemQty,
        countedQty: item.countedQty,
        difference: item.difference,
        notes: item.notes,
      })),
    });
    return this.findById(
      countId,
      items[0]?.tenantId ?? '',
    ) as Promise<InventoryCount>;
  }

  async updateItem(item: InventoryCountItem): Promise<InventoryCountItem> {
    await this.prisma.inventoryCountItem.update({
      where: { id: item.id },
      data: {
        countedQty: item.countedQty,
        difference: item.difference,
        notes: item.notes,
      },
    });
    return item;
  }

  async getItem(
    itemId: string,
    tenantId: string,
  ): Promise<InventoryCountItem | null> {
    const item = await this.prisma.inventoryCountItem.findFirst({
      where: { id: itemId, tenantId },
    });
    return item ? this.toItem(item) : null;
  }

  async getSystemQuantities(
    productIds: string[],
    tenantId: string,
    warehouseId?: string,
  ): Promise<Map<string, number>> {
    const where: any = { productId: { in: productIds }, tenantId };
    if (warehouseId) where.warehouseId = warehouseId;

    const pws = await this.prisma.productWarehouse.findMany({
      where,
      select: { productId: true, stock: true, warehouseId: true },
    });

    const map = new Map<string, number>();
    for (const pw of pws) {
      map.set(pw.productId, (map.get(pw.productId) ?? 0) + pw.stock);
    }
    return map;
  }

  private toCount(c: any): InventoryCount {
    return new InventoryCount(
      c.id,
      c.tenantId,
      c.warehouseId,
      c.userId,
      c.status,
      c.name,
      c.notes,
      c.startedAt,
      c.completedAt,
      c.approvedBy,
      c.approvedAt,
      c.createdAt,
      c.updatedAt,
      c.items?.map((i: any) => this.toItem(i)) ?? [],
    );
  }

  private toItem(i: any): InventoryCountItem {
    return new InventoryCountItem(
      i.id,
      i.tenantId,
      i.inventoryCountId,
      i.productId,
      i.productWarehouseId,
      i.systemQty,
      i.countedQty,
      i.difference,
      i.notes,
      i.createdAt,
      i.updatedAt,
    );
  }
}
