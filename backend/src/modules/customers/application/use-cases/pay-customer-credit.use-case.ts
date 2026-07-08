import { Inject, Injectable } from '@nestjs/common';
import { CustomerRepository, CUSTOMER_REPOSITORY } from '../ports/customer.repository.interface';
import { Customer } from '../../domain/customer.entity';
import { FindCustomerByIdUseCase } from './find-customer-by-id.use-case';

@Injectable()
export class PayCustomerCreditUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repo: CustomerRepository,
    private readonly findCustomerById: FindCustomerByIdUseCase,
  ) {}

  async execute(id: string, tenantId: string, amount: number): Promise<Customer> {
    const customer = await this.findCustomerById.execute(id, tenantId);
    const newBalance = customer.payCredit(amount);
    return this.repo.update(id, tenantId, { balance: newBalance });
  }
}
