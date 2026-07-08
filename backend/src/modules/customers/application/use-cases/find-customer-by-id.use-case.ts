import { Inject, Injectable } from '@nestjs/common';
import { CustomerRepository, CUSTOMER_REPOSITORY } from '../ports/customer.repository.interface';
import { Customer } from '../../domain/customer.entity';
import { CustomerNotFoundException } from '../../domain/customers.errors';

@Injectable()
export class FindCustomerByIdUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repo: CustomerRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<Customer> {
    const customer = await this.repo.findById(id, tenantId);
    if (!customer) throw new CustomerNotFoundException();
    return customer;
  }
}
