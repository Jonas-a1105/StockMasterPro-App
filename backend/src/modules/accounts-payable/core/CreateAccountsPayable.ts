import { AccountsPayableRepository, CreatePayableData } from './interfaces/AccountsPayableRepository.interface';
import { AccountsPayable } from '../domain/AccountsPayable';

export class CreateAccountsPayable {
  constructor(private readonly repo: AccountsPayableRepository) {}

  async execute(data: CreatePayableData): Promise<AccountsPayable> {
    if (data.totalAmount <= 0) throw new Error('El monto total debe ser mayor a cero');
    if (!data.supplierId) throw new Error('El proveedor es obligatorio');
    return this.repo.create(data);
  }
}
