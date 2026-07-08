import { Inject, Injectable } from '@nestjs/common';
import { CustomerRepository, CUSTOMER_REPOSITORY } from '../ports/customer.repository.interface';
import { Customer } from '../../domain/customer.entity';
import { PaginatedResult, paginate } from '@shared/application/pagination';

@Injectable()
export class FindAllCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly repo: CustomerRepository,
  ) {}

  async execute(tenantId: string, page = 1, limit = 50): Promise<PaginatedResult<Customer>> {
    const { take, skip } = paginate(page, limit);
    const [data, total] = await Promise.all([
      this.repo.findAll(tenantId, take, skip),
      this.repo.count(tenantId),
    ]);
    return { data, total, limit: take, offset: skip };
  }
}
