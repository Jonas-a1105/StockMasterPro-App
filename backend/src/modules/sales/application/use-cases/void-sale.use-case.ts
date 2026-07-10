import { Inject, Injectable } from '@nestjs/common';
import {
  SaleRepository,
  SALES_REPOSITORY,
} from '../ports/sale.repository.interface';

@Injectable()
export class VoidSaleUseCase {
  constructor(
    @Inject(SALES_REPOSITORY)
    private readonly saleRepo: SaleRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    return this.saleRepo.voidSale(id, tenantId);
  }
}
