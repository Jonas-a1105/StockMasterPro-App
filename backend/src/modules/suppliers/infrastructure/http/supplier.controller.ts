import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SupplierService } from '../supplier.service';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supplierService.findAll(user.tenantId, Number(page) || 1, Number(limit) || 50);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.supplierService.findById(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  async create(@Body() dto: CreateSupplierDto, @CurrentUser() user: AuthenticatedUser) {
    return this.supplierService.create(user.tenantId, dto);
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.supplierService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.supplierService.delete(id, user.tenantId);
  }
}
