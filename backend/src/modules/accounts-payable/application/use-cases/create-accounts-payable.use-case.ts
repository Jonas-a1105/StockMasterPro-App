import { Inject, Injectable } from '@nestjs/common';
import { AccountsPayableRepository, CreatePayableData, ACCOUNTS_PAYABLE_REPOSITORY } from '../ports/accounts-payable.repository.interface';
import { AccountsPayable } from '../../domain/accounts-payable.entity';

@Injectable()
export class CreateAccountsPayableUseCase {
  constructor(
    @Inject(ACCOUNTS_PAYABLE_REPOSITORY)
    private readonly repo: AccountsPayableRepository,
  ) {}

  async execute(data: CreatePayableData): Promise<AccountsPayable> {
    if (data.totalAmount <= 0) throw new Error('El monto total debe ser mayor a cero');
    if (!data.supplierId) throw new Error('El proveedor es obligatorio');
    return this.repo.create(data);
  }
}
