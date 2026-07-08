import { Inject, Injectable } from '@nestjs/common';
import {
  CashRegisterRepository,
  CASH_REGISTER_REPOSITORY,
} from '../ports/cash-register.repository.interface';
import { CashSession } from '../../domain/cash-session.entity';

@Injectable()
export class ListCashSessionsUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly repo: CashRegisterRepository,
  ) {}

  async execute(tenantId: string): Promise<CashSession[]> {
    return this.repo.findAll(tenantId);
  }
}
