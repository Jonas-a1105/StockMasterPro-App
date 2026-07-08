import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProductRepository } from '../core/interfaces/ProductRepository.interface';
import { Product } from '../domain/Product';

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
    const p = await this.prisma.product.update({ where: { id }, data });
    return this.toProduct(p);
  }

  async delete(id: string, _tenantId: string): Promise<void> {
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

  private toProduct(p: any): Product {
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
