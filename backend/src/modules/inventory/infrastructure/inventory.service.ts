import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PostgresProductRepo } from './PostgresProductRepo';
import { CreateProduct } from '../core/CreateProduct';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly productRepo: PostgresProductRepo,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(tenantId: string) {
    return this.productRepo.findAll(tenantId);
  }

  async findById(id: string, tenantId: string) {
    const product = await this.productRepo.findById(id, tenantId);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async create(data: {
    tenantId: string;
    name: string;
    description?: string;
    barcode?: string;
    price: number;
    cost?: number;
    stock?: number;
    minStock?: number;
    categoryId?: string;
    imageUrl?: string;
    brand?: string;
  }) {
    const useCase = new CreateProduct(this.productRepo);
    return useCase.execute({
      ...data,
      cost: data.cost ?? 0,
      stock: data.stock ?? 0,
    });
  }

  async update(id: string, tenantId: string, data: any) {
    await this.findById(id, tenantId);
    return this.productRepo.update(id, tenantId, data);
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.productRepo.delete(id, tenantId);
  }

  async adjustStock(
    productId: string,
    tenantId: string,
    userId: string,
    data: { quantity: number; type: string; reason?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });
      if (!product || product.tenantId !== tenantId)
        throw new NotFoundException('Producto no encontrado');
      const newStock = product.stock + data.quantity;
      if (newStock < 0)
        throw new BadRequestException('Stock no puede ser negativo');
      await tx.product.update({
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
      return this.productRepo.findById(productId, tenantId);
    });
  }

  async findAllAdjustments(tenantId: string, limit?: number, offset?: number) {
    return this.productRepo.findAllAdjustments(tenantId, limit, offset);
  }

  async getLowStock(tenantId: string) {
    return this.productRepo.findLowStock(tenantId);
  }

  async getMovements(
    productId: string,
    tenantId: string,
    limit?: number,
    offset?: number,
  ) {
    await this.findById(productId, tenantId);
    return this.productRepo.getMovements(productId, tenantId, limit, offset);
  }
}
