import { Inject, Injectable } from '@nestjs/common';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../ports/product.repository.interface';

@Injectable()
export class FindAllAdjustmentsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(
    tenantId: string,
    limit?: number,
    offset?: number,
  ): Promise<any[]> {
    return this.productRepo.findAllAdjustments(tenantId, limit, offset);
  }
}
