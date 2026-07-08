import { Inject, Injectable } from '@nestjs/common';
import {
  CashRegisterRepository,
  CASH_REGISTER_REPOSITORY,
  OpenSessionData,
} from '../ports/cash-register.repository.interface';
import { CashSession } from '../../domain/cash-session.entity';
import { SessionAlreadyOpenException } from '../../domain/cash-register.errors';

@Injectable()
export class OpenCashSessionUseCase {
  constructor(
    @Inject(CASH_REGISTER_REPOSITORY)
    private readonly repo: CashRegisterRepository,
  ) {}

  async execute(data: OpenSessionData): Promise<CashSession> {
    const existing = await this.repo.findOpenSession(data.userId, data.tenantId);
    if (existing) throw new SessionAlreadyOpenException();
    return this.repo.openSession(data);
  }
}
