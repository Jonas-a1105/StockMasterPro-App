import { Inject, Injectable } from '@nestjs/common';
import { CustomerRepository, CUSTOMER_REPOSITORY } from '../ports/customer.repository.interface';
import { Customer } from '../../domain/customer.entity';

@Injectable()
export class FindAllCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repo: CustomerRepository,
  ) {}

  async execute(tenantId: string): Promise<Customer[]> {
    return this.repo.findAll(tenantId);
  }
}
