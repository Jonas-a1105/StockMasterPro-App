import { Module } from '@nestjs/common';
import { CashRegisterController } from './http/cash-register.controller';
import { PrismaModule } from '@shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CashRegisterController],
  providers: [],
})
export class CashRegisterModule {}
