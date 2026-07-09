import { Inject, Injectable } from '@nestjs/common';
import {
  CustomerRepository,
  CUSTOMER_REPOSITORY,
} from '../ports/customer.repository.interface';
import { FindCustomerByIdUseCase } from './find-customer-by-id.use-case';

@Injectable()
export class DeleteCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repo: CustomerRepository,
    private readonly findCustomerById: FindCustomerByIdUseCase,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    await this.findCustomerById.execute(id, tenantId);
    return this.repo.delete(id, tenantId);
  }
}
