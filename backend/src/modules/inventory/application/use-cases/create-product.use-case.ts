import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository, PRODUCT_REPOSITORY } from '../ports/product.repository.interface';
import { Product } from '../../domain/product.entity';
import { DuplicateBarcodeException } from '../../domain/inventory.errors';

export interface CreateProductInput {
  tenantId: string;
  name: string;
  description?: string | null;
  barcode?: string | null;
  price: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  categoryId?: string | null;
  imageUrl?: string | null;
  brand?: string | null;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(data: CreateProductInput): Promise<Product> {
    const barcode = data.barcode ?? null;
    if (barcode) {
      const existing = await this.productRepo.findByBarcode(
        barcode,
        data.tenantId,
      );
      if (existing) {
        throw new DuplicateBarcodeException();
      }
    }
    return this.productRepo.create({
      tenantId: data.tenantId,
      name: data.name,
      description: data.description ?? null,
      barcode,
      price: data.price,
      cost: data.cost ?? 0,
      stock: data.stock ?? 0,
      minStock: data.minStock ?? 0,
      categoryId: data.categoryId ?? null,
      imageUrl: data.imageUrl ?? null,
      brand: data.brand ?? null,
    });
  }
}
