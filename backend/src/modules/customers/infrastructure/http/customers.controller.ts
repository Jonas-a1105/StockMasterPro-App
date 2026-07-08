import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { CustomersService } from '../customers.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.findAll(user.tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.customersService.findById(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  async create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthenticatedUser) {
    return this.customersService.create(user.tenantId, dto);
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customersService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.customersService.delete(id, user.tenantId);
  }

  @Post(':id/pay')
  @Roles('admin', 'gerente', 'cajero')
  async payCredit(
    @Param('id') id: string,
    @Body() body: { amount: number },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customersService.payCredit(id, user.tenantId, body.amount);
  }
}
