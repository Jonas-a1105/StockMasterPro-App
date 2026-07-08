import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import type { ProductRepository } from '../application/ports/ProductRepository.interface';
import { CreateProduct } from '../application/use-cases/CreateProduct';
import { AdjustStock } from '../application/use-cases/AdjustStock';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepo: ProductRepository,
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
    // Verify product exists and belongs to the tenant first
    await this.findById(productId, tenantId);
    const useCase = new AdjustStock(this.productRepo);
    try {
      return await useCase.execute({
        productId,
        tenantId,
        userId,
        quantity: data.quantity,
        type: data.type,
        reason: data.reason,
      });
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
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
