import { Inject, Injectable } from '@nestjs/common';
import {
  CustomerRepository,
  CUSTOMER_REPOSITORY,
  CreateCustomerData,
} from '../ports/customer.repository.interface';
import { Customer } from '../../domain/customer.entity';
import { FindCustomerByIdUseCase } from './find-customer-by-id.use-case';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repo: CustomerRepository,
    private readonly findCustomerById: FindCustomerByIdUseCase,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    data: Partial<CreateCustomerData>,
  ): Promise<Customer> {
    await this.findCustomerById.execute(id, tenantId);
    return this.repo.update(id, tenantId, data);
  }
}
