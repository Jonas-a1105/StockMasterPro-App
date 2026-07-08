import { Inject, Injectable } from '@nestjs/common';
import { SaleRepository, SALES_REPOSITORY } from '../ports/SaleRepository.interface';
import { Sale } from '../../domain/Sale';

@Injectable()
export class FindSaleByIdUseCase {
  constructor(
    @Inject(SALES_REPOSITORY)
    private readonly saleRepo: SaleRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<Sale | null> {
    return this.saleRepo.findById(id, tenantId);
  }
}
