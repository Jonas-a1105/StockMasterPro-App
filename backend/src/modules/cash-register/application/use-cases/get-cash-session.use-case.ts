import { Inject, Injectable } from '@nestjs/common';
import {
  CashRegisterRepository,
  CASH_REGISTER_REPOSITORY,
} from '../ports/cash-register.repository.interface';
import { CashSession } from '../../domain/cash-session.entity';
import { SessionNotFoundException } from '../../domain/cash-register.errors';

@Injectable()
export class GetCashSessionUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly repo: CashRegisterRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<CashSession> {
    const session = await this.repo.findById(id, tenantId);
    if (!session) throw new SessionNotFoundException();
    return session;
  }
}
