export { CustomersModule } from './infrastructure/customers.module';
export { CUSTOMER_REPOSITORY } from './application/ports/customer.repository.interface';
export type { CustomerRepository } from './application/ports/customer.repository.interface';
export { Customer } from './domain/customer.entity';
export { FindCustomerByIdUseCase } from './application/use-cases/find-customer-by-id.use-case';
