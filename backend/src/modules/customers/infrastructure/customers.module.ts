import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';
import { CustomersController } from './http/customers.controller';
import { CUSTOMER_REPOSITORY } from '../application/ports/customer.repository.interface';
import { PostgresCustomerRepo } from './persistence/postgres-customer.repository';
import { FindAllCustomersUseCase } from '../application/use-cases/find-all-customers.use-case';
import { FindCustomerByIdUseCase } from '../application/use-cases/find-customer-by-id.use-case';
import { CreateCustomerUseCase } from '../application/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from '../application/use-cases/update-customer.use-case';
import { DeleteCustomerUseCase } from '../application/use-cases/delete-customer.use-case';
import { PayCustomerCreditUseCase } from '../application/use-cases/pay-customer-credit.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [CustomersController],
  providers: [
    { provide: CUSTOMER_REPOSITORY, useClass: PostgresCustomerRepo },
    FindAllCustomersUseCase,
    FindCustomerByIdUseCase,
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    PayCustomerCreditUseCase,
  ],
  exports: [CUSTOMER_REPOSITORY, FindCustomerByIdUseCase],
})
export class CustomersModule {}
