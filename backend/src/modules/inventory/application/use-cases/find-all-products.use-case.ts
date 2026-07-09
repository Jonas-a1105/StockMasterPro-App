import { Inject, Injectable } from '@nestjs/common';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../ports/product.repository.interface';
import { Product } from '../../domain/product.entity';
import { PaginatedResult, paginate } from '@shared/application/pagination';

@Injectable()
export class FindAllProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepo: ProductRepository,
  ) {}

  async execute(
    tenantId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<Product>> {
    const { take, skip } = paginate(page, limit);
    const [data, total] = await Promise.all([
      this.productRepo.findAll(tenantId, take, skip),
      this.productRepo.count(tenantId),
    ]);
    return { data, total, limit: take, offset: skip };
  }
}
