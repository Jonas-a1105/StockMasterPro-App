import { Module } from '@nestjs/common';
import { ExpenseController } from './http/expense.controller';
import { ExpenseService } from './expense.service';
import { PostgresExpenseRepo } from './persistence/postgres-expense.repository';

@Module({
  controllers: [ExpenseController],
  providers: [ExpenseService, PostgresExpenseRepo],
  exports: [ExpenseService],
})
export class ExpenseModule {}
