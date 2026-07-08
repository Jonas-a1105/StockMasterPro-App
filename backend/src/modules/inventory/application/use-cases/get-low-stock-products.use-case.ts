import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository, PRODUCT_REPOSITORY } from '../ports/product.repository.interface';
import { Product } from '../../domain/product.entity';

@Injectable()
export class GetLowStockProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(tenantId: string): Promise<Product[]> {
    return this.productRepo.findLowStock(tenantId);
  }
}
