import { Inject, Injectable } from '@nestjs/common';
import { SaleRepository, SALES_REPOSITORY } from '../ports/SaleRepository.interface';

@Injectable()
export class GetDailySalesSummaryUseCase {
  constructor(
    @Inject(SALES_REPOSITORY)
    private readonly saleRepo: SaleRepository,
  ) {}

  async execute(tenantId: string): Promise<{ total: number; count: number }> {
    return this.saleRepo.getDailySummary(tenantId);
  }
}
