import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { CreateAccountsPayableUseCase } from '../../application/use-cases/create-accounts-payable.use-case';
import { PayAccountsPayableUseCase } from '../../application/use-cases/pay-accounts-payable.use-case';
import { ListAccountsPayableUseCase } from '../../application/use-cases/list-accounts-payable.use-case';
import { FindAccountsPayableByIdUseCase } from '../../application/use-cases/find-accounts-payable-by-id.use-case';
import { GetPayablePaymentsUseCase } from '../../application/use-cases/get-payable-payments.use-case';
import { CreatePayableDto } from '../dto/create-payable.dto';
import { PayPayableDto } from '../dto/pay-payable.dto';

@Controller('accounts-payable')
export class AccountsPayableController {
  constructor(
    private readonly listPayables: ListAccountsPayableUseCase,
    private readonly findPayable: FindAccountsPayableByIdUseCase,
    private readonly createPayable: CreateAccountsPayableUseCase,
    private readonly payPayable: PayAccountsPayableUseCase,
    private readonly getPaymentsUseCase: GetPayablePaymentsUseCase,
  ) {}

  @Get()
  @Roles('admin', 'gerente')
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.listPayables.execute(user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'gerente')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.findPayable.execute(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  create(@Body() dto: CreatePayableDto, @CurrentUser() user: AuthenticatedUser) {
    return this.createPayable.execute({ ...dto, tenantId: user.tenantId });
  }

  @Post('pay')
  @Roles('admin', 'gerente', 'cajero')
  pay(@Body() dto: PayPayableDto, @CurrentUser() user: AuthenticatedUser) {
    return this.payPayable.execute({
      accountPayableId: dto.accountPayableId,
      amount: dto.amount,
      paymentMethod: (dto.paymentMethod as 'cash' | 'card' | 'transfer') ?? 'cash',
      notes: dto.notes,
      tenantId: user.tenantId,
      paidAt: new Date().toISOString(),
    });
  }

  @Get(':id/payments')
  @Roles('admin', 'gerente')
  getPayments(@Param('id') id: string) {
    return this.getPaymentsUseCase.execute(id);
  }
}
