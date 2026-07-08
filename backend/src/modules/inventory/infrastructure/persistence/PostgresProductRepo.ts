import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ProductRepository } from '../../application/ports/ProductRepository.interface';
import { Product } from '../../domain/Product';
import { Product as PrismaProduct } from '@prisma/client';

@Injectable()
export class PostgresProductRepo implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<Product | null> {
    const p = await this.prisma.product.findFirst({ where: { id, tenantId } });
    return p ? this.toProduct(p) : null;
  }

  async findByBarcode(
    barcode: string,
    tenantId: string,
  ): Promise<Product | null> {
    const p = await this.prisma.product.findFirst({
      where: { barcode, tenantId },
    });
    return p ? this.toProduct(p) : null;
  }

  async findAll(tenantId: string): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return products.map((p) => this.toProduct(p));
  }

  async findByIds(ids: string[], tenantId: string): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids }, tenantId },
    });
    return rows.map(this.toProduct);
  }

  async create(data: any): Promise<Product> {
    const p = await this.prisma.product.create({
      data: { ...data, isActive: true },
    });
    return this.toProduct(p);
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<Product>,
  ): Promise<Product> {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Producto no encontrado');
    const p = await this.prisma.product.update({ where: { id }, data });
    return this.toProduct(p);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Producto no encontrado');
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findLowStock(tenantId: string): Promise<Product[]> {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "products" WHERE "tenant_id" = $1 AND "stock" <= "min_stock" AND "min_stock" > 0 ORDER BY (stock::float / NULLIF("min_stock", 0)) ASC`,
      tenantId,
    );
    return rows.map((r) => this.toProduct(r));
  }

  async addMovement(data: {
    tenantId: string;
    productId: string;
    type: string;
    quantity: number;
    reference?: string;
    notes?: string;
    userId: string;
  }): Promise<void> {
    await this.prisma.inventoryMovement.create({ data });
  }

  async findAllAdjustments(tenantId: string, limit = 50, offset = 0): Promise<any[]> {
    return this.prisma.inventoryMovement.findMany({
      where: { tenantId, type: { notIn: ['sale', 'purchase'] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: { product: { select: { name: true, barcode: true } } },
    });
  }

  async getMovements(
    productId: string,
    tenantId: string,
    limit = 50,
    offset = 0,
  ): Promise<any[]> {
    return this.prisma.inventoryMovement.findMany({
      where: { productId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async adjustStock(
    productId: string,
    tenantId: string,
    userId: string,
    data: { quantity: number; type: string; reason?: string },
  ): Promise<Product> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });
      if (!product || product.tenantId !== tenantId) {
        throw new Error('Producto no encontrado');
      }
      const newStock = product.stock + data.quantity;
      if (newStock < 0) {
        throw new Error('Stock no puede ser negativo');
      }
      const p = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });
      await tx.inventoryMovement.create({
        data: {
          tenantId,
          productId,
          type: data.type,
          quantity: data.quantity,
          notes: data.reason || null,
          userId,
        },
      });
      return p;
    });
    return this.toProduct(updated);
  }

  private toProduct(p: PrismaProduct): Product {
    return new Product(
      p.id,
      p.tenantId,
      p.name,
      p.description,
      p.barcode,
      Number(p.price),
      Number(p.cost),
      p.stock,
      p.minStock,
      p.categoryId,
      p.isActive,
      p.imageUrl || null,
      p.brand || null,
    );
  }
}
