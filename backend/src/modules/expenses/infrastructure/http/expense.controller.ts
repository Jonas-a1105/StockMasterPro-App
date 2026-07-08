import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { ExpenseService } from '../expense.service';
import { CreateExpenseDto } from '../dto/create-expense.dto';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpenseController {
  constructor(private readonly service: ExpenseService) {}

  @Get()
  @Roles('admin', 'gerente')
  findAll(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll(user.tenantId, category, startDate, endDate);
  }

  @Get('by-category')
  @Roles('admin', 'gerente')
  getTotalByCategory(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getTotalByCategory(user.tenantId, startDate, endDate);
  }

  @Get(':id')
  @Roles('admin', 'gerente')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles('admin', 'gerente')
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id, user.tenantId);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.tenantId);
  }
}
