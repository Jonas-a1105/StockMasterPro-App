import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { FindAllCustomersUseCase } from '../../application/use-cases/find-all-customers.use-case';
import { FindCustomerByIdUseCase } from '../../application/use-cases/find-customer-by-id.use-case';
import { CreateCustomerUseCase } from '../../application/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from '../../application/use-cases/update-customer.use-case';
import { DeleteCustomerUseCase } from '../../application/use-cases/delete-customer.use-case';
import { PayCustomerCreditUseCase } from '../../application/use-cases/pay-customer-credit.use-case';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly findAllUseCase: FindAllCustomersUseCase,
    private readonly findOneUseCase: FindCustomerByIdUseCase,
    private readonly createUseCase: CreateCustomerUseCase,
    private readonly updateUseCase: UpdateCustomerUseCase,
    private readonly deleteUseCase: DeleteCustomerUseCase,
    private readonly payCreditUseCase: PayCustomerCreditUseCase,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.findAllUseCase.execute(user.tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.findOneUseCase.execute(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  async create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.createUseCase.execute({ ...dto, tenantId: user.tenantId });
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateUseCase.execute(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deleteUseCase.execute(id, user.tenantId);
  }

  @Post(':id/pay')
  @Roles('admin', 'gerente', 'cajero')
  async payCredit(
    @Param('id') id: string,
    @Body() body: { amount: number },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.payCreditUseCase.execute(id, user.tenantId, body.amount);
  }
}
