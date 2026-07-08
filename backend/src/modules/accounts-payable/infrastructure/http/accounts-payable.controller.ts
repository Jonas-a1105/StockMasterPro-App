import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AccountsPayableService } from '../accounts-payable.service';
import { CreatePayableDto } from '../dto/create-payable.dto';
import { PayPayableDto } from '../dto/pay-payable.dto';

@Controller('accounts-payable')
export class AccountsPayableController {
  constructor(private readonly service: AccountsPayableService) {}

  @Get()
  @Roles('admin', 'gerente')
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'gerente')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findById(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  create(@Body() dto: CreatePayableDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.tenantId);
  }

  @Post('pay')
  @Roles('admin', 'gerente', 'cajero')
  pay(@Body() dto: PayPayableDto, @CurrentUser() user: any) {
    return this.service.pay(dto, user.tenantId);
  }

  @Get(':id/payments')
  @Roles('admin', 'gerente')
  getPayments(@Param('id') id: string) {
    return this.service.getPayments(id);
  }
}
