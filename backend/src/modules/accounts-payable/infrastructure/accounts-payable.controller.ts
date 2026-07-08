import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AccountsPayableService } from './accounts-payable.service';
import { CreatePayableDto } from './dto/create-payable.dto';
import { PayPayableDto } from './dto/pay-payable.dto';

@Controller('accounts-payable')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsPayableController {
  constructor(private readonly service: AccountsPayableService) {}

  @Get()
  @Roles('admin', 'gerente')
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'gerente')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
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
