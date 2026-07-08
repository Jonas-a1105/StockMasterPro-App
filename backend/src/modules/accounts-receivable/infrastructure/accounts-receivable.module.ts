import { Module } from '@nestjs/common';
import { AccountsReceivableController } from './http/accounts-receivable.controller';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AccountsReceivableController],
  providers: [],
})
export class AccountsReceivableModule {}
