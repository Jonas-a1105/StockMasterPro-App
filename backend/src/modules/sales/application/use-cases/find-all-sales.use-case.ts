import { Inject, Injectable } from '@nestjs/common';
import { SaleRepository, SALES_REPOSITORY } from '../ports/sale.repository.interface';
import { Sale } from '../../domain/sale.entity';

@Injectable()
export class FindAllSalesUseCase {
  constructor(
    @Inject(SALES_REPOSITORY)
    private readonly saleRepo: SaleRepository,
  ) {}

  async execute(tenantId: string): Promise<Sale[]> {
    return this.saleRepo.findAll(tenantId);
  }
}
