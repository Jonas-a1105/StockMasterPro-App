import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { PostgresExpenseRepo } from './PostgresExpenseRepo';

@Module({
  controllers: [ExpenseController],
  providers: [ExpenseService, PostgresExpenseRepo],
  exports: [ExpenseService],
})
export class ExpenseModule {}
