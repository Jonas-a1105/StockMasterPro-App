import { Inject, Injectable } from '@nestjs/common';
import { ProductRepository, PRODUCT_REPOSITORY } from '../ports/ProductRepository.interface';
import { FindProductByIdUseCase } from './FindProductById';

@Injectable()
export class GetProductMovementsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
    private readonly findProductById: FindProductByIdUseCase,
  ) {}

  async execute(
    productId: string,
    tenantId: string,
    limit?: number,
    offset?: number,
  ): Promise<any[]> {
    await this.findProductById.execute(productId, tenantId);
    return this.productRepo.getMovements(productId, tenantId, limit, offset);
  }
}
