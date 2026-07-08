import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository, PRODUCT_REPOSITORY } from '../ports/ProductRepository.interface';
import { FindProductByIdUseCase } from './FindProductById';

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
    private readonly findProductById: FindProductByIdUseCase,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    await this.findProductById.execute(id, tenantId);
    return this.productRepo.delete(id, tenantId);
  }
}
