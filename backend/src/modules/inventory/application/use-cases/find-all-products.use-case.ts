import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository, PRODUCT_REPOSITORY } from '../ports/product.repository.interface';
import { Product } from '../../domain/product.entity';

@Injectable()
export class FindAllProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(tenantId: string): Promise<Product[]> {
    return this.productRepo.findAll(tenantId);
  }
}
