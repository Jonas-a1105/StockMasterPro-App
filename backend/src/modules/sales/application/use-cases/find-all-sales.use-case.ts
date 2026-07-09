import { Inject, Injectable } from '@nestjs/common';
import {
  SaleRepository,
  SALES_REPOSITORY,
} from '../ports/sale.repository.interface';
import { Sale } from '../../domain/sale.entity';
import { PaginatedResult, paginate } from '@shared/application/pagination';

@Injectable()
export class FindAllSalesUseCase {
  constructor(
    @Inject(SALES_REPOSITORY)
    private readonly saleRepo: SaleRepository,
  ) {}

  async execute(
    tenantId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<Sale>> {
    const { take, skip } = paginate(page, limit);
    const [data, total] = await Promise.all([
      this.saleRepo.findAll(tenantId, take, skip),
      this.saleRepo.count(tenantId),
    ]);
    return { data, total, limit: take, offset: skip };
  }
}
