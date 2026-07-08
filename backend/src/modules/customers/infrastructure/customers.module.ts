import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { PostgresCustomerRepo } from './PostgresCustomerRepo';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, PostgresCustomerRepo],
  exports: [PostgresCustomerRepo],
})
export class CustomersModule {}
