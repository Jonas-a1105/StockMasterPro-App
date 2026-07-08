import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { CreateReceivableDto } from '../../application/dtos/create-receivable.dto';
import { PayReceivableDto } from '../../application/dtos/pay-receivable.dto';
import { CreateAccountsReceivableUseCase } from '../../application/use-cases/create-accounts-receivable.use-case';
import { ListAccountsReceivableUseCase } from '../../application/use-cases/list-accounts-receivable.use-case';
import { FindAccountsReceivableByIdUseCase } from '../../application/use-cases/find-accounts-receivable-by-id.use-case';
import { ListByCustomerUseCase } from '../../application/use-cases/list-by-customer.use-case';
import { PayAccountsReceivableUseCase } from '../../application/use-cases/pay-accounts-receivable.use-case';
import { GetReceivablePaymentsUseCase } from '../../application/use-cases/get-receivable-payments.use-case';

@Controller('accounts-receivable')
export class AccountsReceivableController {
  constructor(
    private readonly createUseCase: CreateAccountsReceivableUseCase,
    private readonly listUseCase: ListAccountsReceivableUseCase,
    private readonly findByIdUseCase: FindAccountsReceivableByIdUseCase,
    private readonly listByCustomerUseCase: ListByCustomerUseCase,
    private readonly payUseCase: PayAccountsReceivableUseCase,
    private readonly getPaymentsUseCase: GetReceivablePaymentsUseCase,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listUseCase.execute(user.tenantId, Number(page) || 1, Number(limit) || 50);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.findByIdUseCase.execute(id, user.tenantId);
  }

  @Get('customer/:customerId')
  async findByCustomer(
    @Param('customerId') customerId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.listByCustomerUseCase.execute(customerId, user.tenantId);
  }

  @Post()
  async create(@Body() dto: CreateReceivableDto, @CurrentUser() user: AuthenticatedUser) {
    return this.createUseCase.execute({
      tenantId: user.tenantId,
      customerId: dto.customerId,
      saleId: dto.saleId,
      totalAmount: dto.totalAmount,
      dueDate: dto.dueDate,
      notes: dto.notes,
    });
  }

  @Post(':id/pay')
  async pay(
    @Param('id') id: string,
    @Body() dto: PayReceivableDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payUseCase.execute({
      tenantId: user.tenantId,
      accountReceivableId: id,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes,
      paidAt: dto.paidAt ?? new Date().toISOString(),
    });
  }

  @Get(':id/payments')
  async getPayments(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.getPaymentsUseCase.execute(id, user.tenantId);
  }
}
