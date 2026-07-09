import { Inject, Injectable } from '@nestjs/common';
import {
  SaleRepository,
  SALES_REPOSITORY,
} from '../ports/sale.repository.interface';
import { Sale } from '../../domain/sale.entity';
import { SaleNotFoundException } from '../../domain/sales.errors';

@Injectable()
export class FindSaleByIdUseCase {
  constructor(
    @Inject(SALES_REPOSITORY)
    private readonly saleRepo: SaleRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<Sale> {
    const sale = await this.saleRepo.findById(id, tenantId);
    if (!sale) throw new SaleNotFoundException();
    return sale;
  }
}
