import { Inject, Injectable } from '@nestjs/common';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../ports/product.repository.interface';
import { Product } from '../../domain/product.entity';
import { FindProductByIdUseCase } from './find-product-by-id.use-case';
import { CreateProductInput } from './create-product.use-case';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
    private readonly findProductById: FindProductByIdUseCase,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    data: Partial<CreateProductInput>,
  ): Promise<Product> {
    await this.findProductById.execute(id, tenantId);
    return this.productRepo.update(id, tenantId, data);
  }
}
