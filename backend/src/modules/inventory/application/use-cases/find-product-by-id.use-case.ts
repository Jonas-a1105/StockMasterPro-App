import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository, PRODUCT_REPOSITORY } from '../ports/product.repository.interface';
import { Product } from '../../domain/product.entity';
import { ProductNotFoundException } from '../../domain/inventory.errors';

@Injectable()
export class FindProductByIdUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepo.findById(id, tenantId);
    if (!product) throw new ProductNotFoundException();
    return product;
  }
}
