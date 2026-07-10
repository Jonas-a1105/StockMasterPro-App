import { Inject, Injectable } from '@nestjs/common';
import {
  SaleRepository,
  SALES_REPOSITORY,
  SaleFilters,
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
    filters?: SaleFilters,
  ): Promise<PaginatedResult<Sale>> {
    const { take, skip } = paginate(page, limit);
    const [data, total] = await Promise.all([
      this.saleRepo.findAll(tenantId, filters, take, skip),
      this.saleRepo.count(tenantId, filters),
    ]);
    return { data, total, limit: take, offset: skip };
  }
}
