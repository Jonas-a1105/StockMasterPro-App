import { Inject, Injectable } from '@nestjs/common';
import {
  CustomerRepository,
  CUSTOMER_REPOSITORY,
  CreateCustomerData,
} from '../ports/customer.repository.interface';
import { Customer } from '../../domain/customer.entity';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repo: CustomerRepository,
  ) {}

  async execute(data: CreateCustomerData): Promise<Customer> {
    if (!data.name || data.name.trim() === '') {
      throw new Error('El nombre del cliente es obligatorio');
    }
    return this.repo.create(data);
  }
}
