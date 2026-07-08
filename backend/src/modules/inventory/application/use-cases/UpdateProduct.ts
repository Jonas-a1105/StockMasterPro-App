import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository, PRODUCT_REPOSITORY } from '../ports/ProductRepository.interface';
import { Product } from '../../domain/Product';
import { FindProductByIdUseCase } from './FindProductById';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
    private readonly findProductById: FindProductByIdUseCase,
  ) {}

  async execute(id: string, tenantId: string, data: any): Promise<Product> {
    await this.findProductById.execute(id, tenantId);
    return this.productRepo.update(id, tenantId, data);
  }
}
